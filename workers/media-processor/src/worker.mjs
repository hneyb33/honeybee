import { encode as encodeBlurhash } from "blurhash";

/**
 * Honeybee media processor - the `hb-media-process` queue consumer.
 *
 * Triggered by the R2 event notification on `hb-originals` (and, locally /
 * for re-drives, by a direct `object_created` message the app publishes).
 * Per message:
 *   1. parse + validate the immutable original key,
 *   2. load the media row from Supabase (service-role REST),
 *   3. magic-byte sniff the stored bytes (extension is client-supplied, the
 *      leading bytes are not),
 *   4. emit the three fixed WebP variants through the Images binding - the
 *      re-encode inherently strips EXIF/GPS - and compute a BlurHash,
 *   5. write variants to `hb-media` with immutable cache headers,
 *   6. flip the row to `ready` (moderation_status stays `pending` until the
 *      existing verification gate approves it).
 *
 * Every step is idempotent: the event notification and the app's direct send
 * can both deliver the same key, and variants that already exist are skipped.
 */

const VARIANTS = [
  { name: "thumb", width: 200 },
  { name: "card", width: 640 },
  { name: "detail", width: 1280 },
];

const MEDIA_SELECT =
  "id,listing_id,ad_id,url,kind,sort_order,processing_status,storage_provider,media_key,variant_prefix,blurhash,moderation_status";

const MAX_BLURHASH_DIMENSION = 32;

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      let outcome = "ok";
      const started = Date.now();
      try {
        outcome = await processMessage(message, env);
        message.ack();
      } catch (error) {
        console.error("media-processor: transient failure", message.body, error);
        if (message.attemptCount >= 3) {
          // Last attempt: land in the DLQ path and mark the row failed so the
          // UI shows the friendly "processing failed" state instead of an
          // asset stuck on "processing" forever.
          outcome = "failed";
          await safeMarkFailed(message, env, error);
          message.ack();
        } else {
          outcome = "retry";
          message.retry();
        }
      }
      writeDatapoint(env, {
        outcome,
        durationMs: Date.now() - started,
        key: describeKey(message.body),
      });
    }
  },
};

/** Returns a short outcome string; throws for retryable infrastructure errors. */
async function processMessage(message, env) {
  for (const event of normalizeEvents(message.body)) {
    const result = await processEvent(event, env);
    if (result !== "ok") return result;
  }
  return "ok";
}

/**
 * Accepts both message shapes:
 *  - the app's `{type:"object_created", bucket, key, assetId}` re-drive,
 *  - the R2 event notification batch (`[{eventType:"ObjectCreated", ...}]`).
 * Only originals in the private bucket are processed; variants and diagnostic
 * probes are ignored by design (they never enter this queue in production).
 */
function normalizeEvents(body) {
  const items = Array.isArray(body) ? body : [body];
  const events = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "object_created") {
      events.push({ key: item.key, bucket: item.bucket });
      continue;
    }
    const key = item.key ?? item.object?.key ?? item.eventKey?.name;
    const bucket = item.bucket ?? item.bucketName ?? item.bucketNameOrId;
    const type = item.eventType ?? item.type;
    if (key && (!type || String(type).startsWith("Object"))) {
      events.push({ key, bucket });
    }
  }
  return events;
}

async function processEvent(event, env) {
  const { env: envSegment, userId, scope, targetId, assetId, isOriginal } =
    parseOriginalKey(event.key);
  if (!isOriginal || envSegment !== env.R2_ENV) {
    return "ok"; // Not a pipeline object for this environment - ignore.
  }
  if (event.bucket && event.bucket !== env.ORIGINALS_BUCKET) {
    return "ok"; // Variant/diagnostic bucket - never processed.
  }

  const table = scope === "ad" ? "ad_media" : "profile_media";
  const row = await fetchRow(env, table, event.key);
  if (!row) return "skipped"; // Orphan object (abandoned before finalize).
  if (row.processing_status === "ready") return "ok"; // Already processed.

  // Full original bytes: the magic-byte check runs on what is actually stored.
  const object = await env.HB_ORIGINALS.get(event.key);
  if (!object) throw new Error(`original missing from HB_ORIGINALS: ${event.key}`);
  const bytes = new Uint8Array(await object.arrayBuffer());
  if (!sniffImageFormat(bytes)) {
    await markFailed(env, table, row.id, "unsupported-format");
    return "rejected";
  }

  const info = await pipeline(env, bytes).info();
  const width = info?.width ?? 0;
  const height = info?.height ?? 0;
  if (!width || !height) throw new Error("image metadata unavailable");

  const variantPrefix = variantObjectPrefix(envSegment, userId, assetId);
  const urls = {};
  for (const variant of VARIANTS) {
    urls[variant.name] = `https://${env.MEDIA_DOMAIN}/${variantPrefix}/${variant.name}.webp`;
    // Idempotent partial re-runs: keep already-written variants untouched.
    if (await env.HB_MEDIA.head(`${variantPrefix}/${variant.name}.webp`)) continue;
    const response = await pipeline(env, bytes)
      .transform({
        width: variant.width,
        height: variant.width,
        fit: "max",
        withoutEnlargement: true,
      })
      .output({ format: "webp", quality: 80 });
    const buffer = new Uint8Array(await response.arrayBuffer());
    await env.HB_MEDIA.put(`${variantPrefix}/${variant.name}.webp`, buffer, {
      httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
    });
  }

  const blurhash = await computeBlurhash(env, bytes);

  await patchRow(env, table, row.id, {
    url: urls.detail,
    card_url: urls.card,
    detail_url: urls.detail,
    blurhash,
    processing_status: "ready",
  });
  return "ok";
}

// ---------------------------------------------------------------------------
// Key scheme (mirrors parseMediaObjectKey/variantObjectPrefix in
// src/lib/media-policy.ts - keep both in sync when the scheme changes)
// ---------------------------------------------------------------------------

/** `{env}/{userId}/{scope}/{targetId}/{assetId}/original.{ext}` */
function parseOriginalKey(key) {
  const none = { env: null, isOriginal: false };
  if (typeof key !== "string") return none;
  const segments = key.split("/");
  if (segments.length !== 6) return none;
  const [envSegment, userId, scope, targetId, assetId, filename] = segments;
  if (!["listing", "ad"].includes(scope)) return none;
  if (!filename.startsWith("original.")) return none;
  return { env: envSegment, userId, scope, targetId, assetId, isOriginal: true };
}

function variantObjectPrefix(envSegment, userId, assetId) {
  return `${envSegment}/${userId}/${assetId}`;
}

// ---------------------------------------------------------------------------
// Magic bytes (mirrors src/lib/media-magic.ts)
// ---------------------------------------------------------------------------

function sniffImageFormat(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function ascii(bytes, from, to) {
  let out = "";
  for (let i = from; i < to; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

// ---------------------------------------------------------------------------
// Images binding + BlurHash
// ---------------------------------------------------------------------------

function pipeline(env, bytes) {
  return env.IMAGES.input(bytes);
}

/**
 * BlurHash from the raw RGBA output of the Images binding at a tiny
 * resolution. Any failure here only loses the placeholder (the client falls
 * back to a neutral shimmer), never the asset itself.
 */
async function computeBlurhash(env, bytes) {
  try {
    const resize = { width: MAX_BLURHASH_DIMENSION, height: MAX_BLURHASH_DIMENSION, fit: "max" };
    const info = await pipeline(env, bytes).transform(resize).info();
    const response = await pipeline(env, bytes).transform(resize).output({ format: "rgba" });
    const pixels = new Uint8ClampedArray(await response.arrayBuffer());
    const expected = info.width * info.height * 4;
    if (!info.width || !info.height || pixels.length !== expected) return null;
    return encodeBlurhash(pixels, info.width, info.height, 4, 3);
  } catch (error) {
    console.warn("media-processor: blurhash unavailable", error?.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supabase service-role REST (fetch only - no client library in the Worker)
// ---------------------------------------------------------------------------

function supabaseHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

async function fetchRow(env, table, mediaKey) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(
    MEDIA_SELECT
  )}&media_key=eq.${encodeURIComponent(mediaKey)}&limit=1`;
  const response = await fetch(url, { headers: supabaseHeaders(env) });
  if (!response.ok) throw new Error(`${table} lookup failed: HTTP ${response.status}`);
  const rows = await response.json();
  return rows.length ? rows[0] : null;
}

async function patchRow(env, table, id, patch) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`${table} patch failed: HTTP ${response.status}`);
  }
}

async function markFailed(env, table, id, reason) {
  try {
    await patchRow(env, table, id, { processing_status: "failed" });
    console.warn(`media-processor: marked ${table}/${id} failed (${reason})`);
  } catch (error) {
    console.error("media-processor: could not mark row failed", error);
  }
}

/** Terminal path after the last retry: best-effort, never throws. */
async function safeMarkFailed(message, env, error) {
  for (const event of normalizeEvents(message.body)) {
    const parsed = parseOriginalKey(event.key);
    if (!parsed.isOriginal) continue;
    try {
      const table = parsed.scope === "ad" ? "ad_media" : "profile_media";
      const row = await fetchRow(env, table, event.key);
      if (row && row.processing_status !== "ready") {
        await markFailed(env, table, row.id, error?.message ?? "unknown");
      }
    } catch {
      // The DLQ keeps the message for manual re-drives via Admin diagnostics.
    }
  }
}

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

function writeDatapoint(env, { outcome, durationMs, key }) {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [outcome],
      doubles: [durationMs],
      indexes: [key ?? ""],
    });
  } catch {
    // Analytics must never break the pipeline.
  }
}

function describeKey(body) {
  for (const event of normalizeEvents(body)) {
    if (event.key) return event.key;
  }
  return null;
}
