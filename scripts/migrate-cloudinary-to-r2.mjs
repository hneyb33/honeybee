#!/usr/bin/env node
/**
 * Cloudinary -> R2/Stream migration for Honeybee media.
 *
 * Walks every `storage_provider='cloudinary'` row in `profile_media` and
 * `ad_media` (newest provider columns stay untouched for legacy `supabase`
 * rows, which still render through their own URLs), and for each one:
 *
 *   photos  downloads the original from Cloudinary, stores it under the
 *           immutable R2 key scheme in `hb-originals`, generates the same three
 *           fixed WebP variants the queue processor emits (thumb 200 / card 640
 *           / detail 1280, quality 80 - EXIF stripped by the re-encode),
 *           computes the BlurHash, writes them to `hb-media` with immutable
 *           cache headers, flips the row to `storage_provider='r2'` + `ready`,
 *           and finally rebuilds `listings.images`/`cover_image` and
 *           `ads.cover_image` exactly like resyncListingMedia/resyncAdMedia;
 *   videos  with `--include-videos`, pushes each original through Cloudflare
 *           Stream direct upload and rewrites the row to
 *           `storage_provider='stream'` once encoding is done.
 *
 * The run is idempotent: a JSON checkpoint file records every row id that
 * finished, existing R2 objects are never overwritten, and reruns skip both.
 * `--dry` logs every planned change without writing a single byte.
 *
 * Usage (production env values required - same variables as the app):
 *   node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs --dry --limit 5
 *   node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs
 *   node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs --include-videos
 *
 * Flags: --dry | --limit N | --table profile_media|ad_media | --include-videos
 *        --checkpoint <file> (default .cloudinary-migration-checkpoint.json)
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { encode as encodeBlurhash } from "blurhash";

// ---------------------------------------------------------------------------
// Config (mirrors src/lib/cloudflare/config.ts + media-policy.ts - keep in sync)
// ---------------------------------------------------------------------------

const VARIANTS = [
  { name: "thumb", width: 200 },
  { name: "card", width: 640 },
  { name: "detail", width: 1280 },
];
const VARIANT_QUALITY = 80;
const MAX_BLURHASH_DIMENSION = 32;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const PAGE_SIZE = 50;
const STREAM_POLL_MS = 5000;
const STREAM_POLL_LIMIT = 60; // 5 minutes max per video

function env(name, fallback = undefined) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function requireEnv(name) {
  const value = env(name);
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const config = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
  accountId: requireEnv("CF_ACCOUNT_ID"),
  accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
  secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  envSegment: env("R2_ENV", "production"),
  mediaDomain: env("NEXT_PUBLIC_MEDIA_DOMAIN", "media.honeysbees.com"),
  originalsBucket: env("R2_ORIGINALS_BUCKET", "hb-originals"),
  mediaBucket: env("R2_MEDIA_BUCKET", "hb-media"),
};

// ---------------------------------------------------------------------------
// CLI args + checkpoint
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function flagValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
const dryRun = args.includes("--dry");
const limit = Number(flagValue("--limit") ?? Number.MAX_SAFE_INTEGER);
const tableFilter = flagValue("--table");
const includeVideos = args.includes("--include-videos");
const checkpointPath = flagValue("--checkpoint") ?? ".cloudinary-migration-checkpoint.json";

function loadCheckpoint() {
  if (!existsSync(checkpointPath)) return { done: [] };
  try {
    const parsed = JSON.parse(readFileSync(checkpointPath, "utf8"));
    return Array.isArray(parsed.done) ? parsed : { done: [] };
  } catch {
    return { done: [] };
  }
}
const checkpoint = loadCheckpoint();
const doneSet = new Set(checkpoint.done);
let lastCheckpointSave = 0;

function markDone(rowId) {
  doneSet.add(rowId);
  checkpoint.done = [...doneSet];
  // Throttled writes keep a long run cheap and resumable.
  const now = Date.now();
  if (now - lastCheckpointSave > 2000) {
    lastCheckpointSave = now;
    saveCheckpoint();
  }
}

function saveCheckpoint() {
  if (dryRun) return;
  writeFileSync(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Key scheme twins of src/lib/media-policy.ts
// ---------------------------------------------------------------------------

function extensionForMimeType(kind, mimeType) {
  const subtype = (String(mimeType ?? "").split("/")[1] ?? "").split(";")[0].trim();
  if (kind === "photo") {
    if (subtype === "jpeg" || subtype === "jpg") return "jpg";
    if (subtype === "png") return "png";
    if (subtype === "webp") return "webp";
    return "jpg";
  }
  if (subtype === "quicktime") return "mov";
  if (subtype === "webm") return "webm";
  return "mp4";
}

function originalKey(envSegment, userId, scope, targetId, assetId, extension) {
  return `${envSegment}/${userId}/${scope}/${targetId}/${assetId}/original.${extension}`;
}

function variantPrefix(envSegment, userId, assetId) {
  return `${envSegment}/${userId}/${assetId}`;
}

function variantUrl(prefix, variant) {
  return `https://${config.mediaDomain}/${prefix}/${variant}.webp`;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
});

async function objectExists(bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function putObject(bucket, key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(bucket === config.mediaBucket ? { CacheControl: CACHE_CONTROL } : {}),
    })
  );
}

async function downloadFromCloudinary(publicId, kind, extension) {
  const resourceType = kind === "video" ? "video" : "image";
  const url = `https://res.cloudinary.com/${config.cloudName}/${resourceType}/upload/${publicId}.${extension}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Cloudinary download failed: HTTP ${response.status} for ${publicId}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Image pipeline (mirrors workers/media-processor/src/worker.mjs exactly)
// ---------------------------------------------------------------------------

async function generateVariants(bytes) {
  const variants = new Map();
  for (const variant of VARIANTS) {
    const buffer = await sharp(bytes)
      .resize({ width: variant.width, height: variant.width, fit: "max", withoutEnlargement: true })
      .webp({ quality: VARIANT_QUALITY })
      .toBuffer();
    variants.set(variant.name, buffer);
  }
  return variants;
}

async function computeBlurhash(bytes) {
  try {
    const { data, info } = await sharp(bytes)
      .resize({
        width: MAX_BLURHASH_DIMENSION,
        height: MAX_BLURHASH_DIMENSION,
        fit: "max",
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (data.length !== info.width * info.height * 4) return null;
    return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  } catch (error) {
    console.warn(`  blurhash unavailable: ${error?.message ?? error}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Row walk
// ---------------------------------------------------------------------------

async function fetchCloudinaryRows(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(
        "id,url,kind,sort_order,mime_type,bytes,duration_seconds,storage_provider,cloudinary_public_id,media_key,processing_status," +
          (table === "ad_media" ? "ad_id" : "listing_id")
      )
      .eq("storage_provider", "cloudinary")
      .not("cloudinary_public_id", "is", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table} paging failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function resolveOwner(row, table) {
  if (table === "ad_media") {
    const { data } = await supabase.from("ads").select("user_id").eq("id", row.ad_id).maybeSingle();
    return { userId: data?.user_id ?? null, targetId: row.ad_id, scope: "ad" };
  }
  const { data } = await supabase.from("listings").select("user_id").eq("id", row.listing_id).maybeSingle();
  return { userId: data?.user_id ?? null, targetId: row.listing_id, scope: "listing" };
}

// ---------------------------------------------------------------------------
// One photo row
// ---------------------------------------------------------------------------

async function migratePhoto(row, table) {
  const { userId, targetId, scope } = await resolveOwner(row, table);
  if (!userId) {
    console.warn(`  skipped: no owner user id for ${targetId}`);
    return "skipped";
  }
  const extension = extensionForMimeType("photo", row.mime_type);
  const key = originalKey(config.envSegment, userId, scope, targetId, row.id, extension);
  const prefix = variantPrefix(config.envSegment, userId, row.id);
  const urls = {
    thumb: variantUrl(prefix, "thumb"),
    card: variantUrl(prefix, "card"),
    detail: variantUrl(prefix, "detail"),
  };

  if (dryRun) {
    console.log(
      `  [dry] ${row.cloudinary_public_id} -> ${key}` +
        ` + ${prefix}/{thumb,card,detail}.webp  url=${urls.detail}`
    );
    return "migrated";
  }

  const bytes = await downloadFromCloudinary(row.cloudinary_public_id, "photo", extension);
  const generated = await generateVariants(bytes);
  const blurhash = await computeBlurhash(bytes);

  if (!(await objectExists(config.originalsBucket, key))) {
    await putObject(config.originalsBucket, key, bytes, row.mime_type || "image/jpeg");
  }
  for (const variant of VARIANTS) {
    const variantKey = `${prefix}/${variant.name}.webp`;
    if (await objectExists(config.mediaBucket, variantKey)) continue;
    await putObject(config.mediaBucket, variantKey, generated.get(variant.name), "image/webp");
  }

  const { error } = await supabase
    .from(table)
    .update({
      storage_provider: "r2",
      media_key: key,
      variant_prefix: prefix,
      url: urls.detail,
      card_url: urls.card,
      detail_url: urls.detail,
      blurhash,
      mime_type: "image/webp",
      bytes: generated.get("detail").length,
      processing_status: "ready",
    })
    .eq("id", row.id);
  if (error) throw new Error(`${table} update failed: ${error.message}`);
  return "migrated";
}

// ---------------------------------------------------------------------------
// One video row (opt-in)
// ---------------------------------------------------------------------------

async function migrateVideo(row, table) {
  if (dryRun) {
    console.log(`  [dry] ${row.cloudinary_public_id} -> Cloudflare Stream direct upload`);
    return "migrated";
  }
  const streamAccount = env("CLOUDFLARE_STREAM_ACCOUNT_ID", config.accountId);
  const streamToken = requireEnv("CLOUDFLARE_STREAM_API_TOKEN");
  const extension = extensionForMimeType("video", row.mime_type);

  const bytes = await downloadFromCloudinary(row.cloudinary_public_id, "video", extension);
  const created = await streamCreate(streamAccount, streamToken);
  const response = await fetch(created.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": row.mime_type || "video/mp4" },
    body: bytes,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Stream PUT failed: HTTP ${response.status} for uid ${created.uid}`);
  }

  // Poll until encoding finishes; the row stays a Cloudinary video if it does
  // not, so a rerun simply picks it up again later.
  let status = null;
  for (let attempt = 0; attempt < STREAM_POLL_LIMIT; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, STREAM_POLL_MS));
    status = await streamGet(streamAccount, streamToken, created.uid);
    if (status?.status?.video?.status === "ready") break;
  }
  if (status?.status?.video?.status !== "ready") {
    console.warn(`  video ${created.uid} still encoding; rerun later to finish the row flip`);
    return "skipped";
  }

  const { error } = await supabase
    .from(table)
    .update({
      storage_provider: "stream",
      stream_uid: created.uid,
      url: `https://videodelivery.net/${created.uid}/manifest/video.m3u8`,
      playback_url: `https://videodelivery.net/${created.uid}/manifest/video.m3u8`,
      thumbnail_url: `https://videodelivery.net/${created.uid}/thumbnails/thumbnail.jpg`,
      duration_seconds: status.duration ?? row.duration_seconds ?? null,
      processing_status: "ready",
    })
    .eq("id", row.id);
  if (error) throw new Error(`${table} update failed: ${error.message}`);
  return "migrated";
}

async function streamCreate(accountId, token) {
  const params = new URLSearchParams({ requireSignedURLs: "true", private: "true" });
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct-upload?${params}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}", cache: "no-store" }
  );
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(`Stream direct-upload failed: ${payload?.errors?.[0]?.message ?? `HTTP ${response.status}`}`);
  }
  return { uid: payload.result.uid, uploadURL: payload.result.uploadURL };
}

async function streamGet(accountId, token, uid) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const payload = await response.json();
  return response.ok ? payload.result : null;
}

// ---------------------------------------------------------------------------
// Denormalised column rebuild (script twin of resyncListingMedia/resyncAdMedia)
// ---------------------------------------------------------------------------

function isRenderable(row) {
  if (row.processing_status === "failed") return false;
  if (row.storage_provider === "r2" || row.storage_provider === "stream") {
    return row.processing_status === "ready";
  }
  return true;
}

async function resyncTouched(listingIds, adIds) {
  if (dryRun) return;
  for (const listingId of listingIds) {
    const { data, error } = await supabase
      .from("profile_media")
      .select("url,card_url,detail_url,storage_provider,processing_status")
      .eq("listing_id", listingId)
      .eq("kind", "photo")
      .neq("processing_status", "failed")
      .order("sort_order", { ascending: true });
    if (error || !data) {
      console.warn(`  listings resync read failed for ${listingId}: ${error?.message}`);
      continue;
    }
    const rows = data.filter(isRenderable);
    const images = rows
      .map((row) =>
        row.storage_provider === "cloudinary" || row.storage_provider === "r2"
          ? row.detail_url ?? row.url
          : row.url
      )
      .filter((url) => typeof url === "string" && url.length > 0);
    const coverSource = rows[0];
    const cover = coverSource
      ? coverSource.storage_provider === "r2"
        ? coverSource.card_url ?? coverSource.detail_url ?? coverSource.url
        : coverSource.storage_provider === "cloudinary"
          ? coverSource.card_url ?? coverSource.url
          : coverSource.url
      : null;
    const { error: updateError } = await supabase
      .from("listings")
      .update({ images, cover_image: cover })
      .eq("id", listingId);
    if (updateError) console.warn(`  listings update failed for ${listingId}: ${updateError.message}`);
  }

  for (const adId of adIds) {
    const { data, error } = await supabase
      .from("ad_media")
      .select("url,card_url,detail_url,storage_provider,processing_status")
      .eq("ad_id", adId)
      .eq("kind", "photo")
      .neq("processing_status", "failed")
      .order("sort_order", { ascending: true });
    if (error || !data) {
      console.warn(`  ads resync read failed for ${adId}: ${error?.message}`);
      continue;
    }
    const rows = data.filter(isRenderable);
    const coverSource = rows[0];
    const cover = coverSource
      ? coverSource.storage_provider === "r2"
        ? coverSource.card_url ?? coverSource.detail_url ?? coverSource.url
        : coverSource.url
      : null;
    const { error: updateError } = await supabase
      .from("ads")
      .update({ cover_image: cover })
      .eq("id", adId);
    if (updateError) console.warn(`  ads update failed for ${adId}: ${updateError.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `${dryRun ? "DRY RUN" : "MIGRATING"} cloudinary media -> R2 (${config.originalsBucket}/${config.mediaBucket}, env=${config.envSegment})`
  );
  const tables = tableFilter ? [tableFilter] : ["profile_media", "ad_media"];
  const touchedListings = new Set();
  const touchedAds = new Set();
  const stats = { migrated: 0, skipped: 0, failed: 0, resumed: 0 };
  let processed = 0;

  outer: for (const table of tables) {
    const rows = await fetchCloudinaryRows(table);
    console.log(`${table}: ${rows.length} cloudinary rows`);
    for (const row of rows) {
      if (processed >= limit) break outer;
      if (doneSet.has(row.id)) {
        stats.resumed += 1;
        continue;
      }
      if (row.kind === "video" && !includeVideos) continue;
      processed += 1;
      console.log(`- ${table}/${row.id} (${row.kind}) ${row.cloudinary_public_id}`);
      try {
        const outcome =
          row.kind === "video" ? await migrateVideo(row, table) : await migratePhoto(row, table);
        if (outcome === "migrated") {
          stats.migrated += 1;
          markDone(row.id);
          if (row.kind === "photo") {
            if (table === "ad_media") touchedAds.add(row.ad_id);
            else touchedListings.add(row.listing_id);
          }
        } else {
          stats.skipped += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.error(`  FAILED: ${error?.message ?? error}`);
      }
    }
  }

  await resyncTouched(touchedListings, touchedAds);
  saveCheckpoint();
  console.log(
    `\nDone. migrated=${stats.migrated} skipped=${stats.skipped} failed=${stats.failed} already-done=${stats.resumed}` +
      `${dryRun ? " (nothing was written)" : ""}`
  );
  if (stats.failed > 0) process.exitCode = 1;
}

// Checksum of the checkpoint key set - cheap resume sanity log only.
function fingerprint() {
  return createHash("sha1").update([...doneSet].sort().join(",")).digest("hex").slice(0, 8);
}

main()
  .then(() => console.log(`checkpoint fingerprint: ${fingerprint()}`))
  .catch((error) => {
    console.error("Migration aborted:", error);
    process.exit(1);
  });
