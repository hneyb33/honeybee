import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getCloudflareBindings,
  getCloudflareR2Config,
  type CloudflareR2Config,
} from "@/lib/cloudflare/config";
import { MEDIA_IMAGE_VARIANTS } from "@/lib/media-policy";

/**
 * R2 access for the Next.js server routes.
 *
 * Presigned browser PUTs only work against the S3-compatible endpoint (never a
 * custom domain), so the scoped API token is required for uploads. Verification
 * reads and rejection deletes prefer the native Worker bindings when they
 * exist and fall back to the same S3 client otherwise, so the identical code
 * runs under `wrangler dev`, OpenNext in production and the Vercel dual-run.
 */

const PRESIGN_TTL_SECONDS = 300;

let s3Client: S3Client | null = null;

function getS3Client(config: CloudflareR2Config): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

export interface PresignedUpload {
  uploadUrl: string;
  method: "PUT";
  expiresInSeconds: number;
  /** The browser must send this exact Content-Type on the PUT. */
  contentType: string;
}

/**
 * Signs a single browser PUT for an immutable original key. The key scheme
 * guarantees a re-signed upload of the same asset writes the same bytes to the
 * same key, so a retried PUT after a dropped uplink never duplicates storage.
 */
export async function presignOriginalUpload(
  key: string,
  contentType: string
): Promise<PresignedUpload> {
  const config = getCloudflareR2Config();
  if (!config) throw new Error("R2 is not configured for this deployment.");
  const url = await getSignedUrl(
    getS3Client(config),
    new PutObjectCommand({
      Bucket: config.originalsBucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
  return { uploadUrl: url, method: "PUT", expiresInSeconds: PRESIGN_TTL_SECONDS, contentType };
}

export interface OriginalObjectHead {
  sizeBytes: number;
  contentType: string | null;
}

/** Confirms the browser actually wrote the object; `null` when it did not. */
export async function headOriginal(key: string): Promise<OriginalObjectHead | null> {
  const bindings = getCloudflareBindings();
  if (bindings?.HB_ORIGINALS) {
    const object = await bindings.HB_ORIGINALS.head(key);
    if (!object) return null;
    return { sizeBytes: object.size, contentType: object.contentType ?? null };
  }
  const config = getCloudflareR2Config();
  if (!config) return null;
  try {
    const head = await getS3Client(config).send(
      new HeadObjectCommand({ Bucket: config.originalsBucket, Key: key })
    );
    return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType ?? null };
  } catch {
    return null;
  }
}

/**
 * Reads the leading bytes of a stored original for the magic-byte check.
 * Falls back to a full read on runtimes without ranged S3 access.
 */
export async function readOriginalPrefix(key: string, byteLength = 32): Promise<Uint8Array | null> {
  const bindings = getCloudflareBindings();
  if (bindings?.HB_ORIGINALS) {
    const object = await bindings.HB_ORIGINALS.get(key);
    if (!object) return null;
    const bytes = new Uint8Array(await object.arrayBuffer());
    return bytes.slice(0, byteLength);
  }
  const config = getCloudflareR2Config();
  if (!config) return null;
  try {
    const result = await getS3Client(config).send(
      new GetObjectCommand({
        Bucket: config.originalsBucket,
        Key: key,
        Range: `bytes=0-${byteLength - 1}`,
      })
    );
    const body = await result.Body?.transformToByteArray();
    return body ?? null;
  } catch {
    return null;
  }
}

/** Removes a rejected or abandoned original. Returns false when it fails. */
export async function deleteOriginal(key: string): Promise<boolean> {
  const bindings = getCloudflareBindings();
  if (bindings?.HB_ORIGINALS) {
    try {
      await bindings.HB_ORIGINALS.delete(key);
      return true;
    } catch {
      return false;
    }
  }
  const config = getCloudflareR2Config();
  if (!config) return false;
  try {
    await getS3Client(config).send(
      new DeleteObjectCommand({ Bucket: config.originalsBucket, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Deletes the public variants of an asset (`{prefix}/{variant}.webp`) so a
 * removed asset never lingers on the delivery domain past its cache lifetime.
 * Best-effort: every missing object is success, and failures are reported.
 */
export async function deleteMediaVariants(prefix: string): Promise<boolean> {
  const bindings = getCloudflareBindings();
  const config = getCloudflareR2Config();
  let allRemoved = true;
  for (const variant of MEDIA_IMAGE_VARIANTS) {
    const key = `${prefix}/${variant}.webp`;
    try {
      if (bindings?.HB_MEDIA) {
        await bindings.HB_MEDIA.delete(key);
      } else if (config) {
        await getS3Client(config).send(
          new DeleteObjectCommand({ Bucket: config.mediaBucket, Key: key })
        );
      } else {
        allRemoved = false;
      }
    } catch {
      allRemoved = false;
    }
  }
  return allRemoved;
}

/**
 * Re-drives processing for a stored original. Production relies on the R2
 * event notification, but local `wrangler dev` simulation never fires it, so
 * the finalize route publishes to the queue directly whenever the producer
 * binding exists. The consumer is idempotent, so the double message in
 * production (event + binding send) is harmless.
 */
export async function publishProcessingEvent(payload: {
  bucket: string;
  key: string;
  assetId: string;
}): Promise<boolean> {
  const bindings = getCloudflareBindings();
  if (!bindings?.MEDIA_PROCESS) return false;
  try {
    await bindings.MEDIA_PROCESS.send({ type: "object_created", ...payload });
    return true;
  } catch {
    return false;
  }
}

// A 1x1 PNG so the probe always fits inside any size policy.
const PROBE_PIXEL = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  ),
  (char) => char.charCodeAt(0)
);

export interface R2ProbeResult {
  presign: { ok: boolean; error?: string };
  put: { ok: boolean; error?: string };
  head: { ok: boolean; sizeBytes?: number; error?: string };
  cleanup: { ok: boolean; error?: string };
}

/**
 * Exercises the real production path end to end: presign a PUT, perform the
 * PUT with the same bytes the browser would send, head the object, then delete
 * it. Every step reports its own failure so a broken token, bucket or CORS
 * setup is immediately distinguishable.
 */
export async function probeR2Pipeline(): Promise<R2ProbeResult> {
  const config = getCloudflareR2Config();
  if (!config) {
    return {
      presign: { ok: false, error: "R2 credentials are not configured." },
      put: { ok: false },
      head: { ok: false },
      cleanup: { ok: false },
    };
  }
  const key = `_diagnostics/${crypto.randomUUID()}.png`;
  const result: R2ProbeResult = {
    presign: { ok: true },
    put: { ok: false },
    head: { ok: false },
    cleanup: { ok: false },
  };
  try {
    const presigned = await presignOriginalUpload(key, "image/png");
    const response = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: new Blob([PROBE_PIXEL], { type: "image/png" }),
      cache: "no-store",
    });
    result.put = response.ok
      ? { ok: true }
      : { ok: false, error: `HTTP ${response.status} ${(await response.text()).slice(0, 200)}` };
  } catch (error) {
    result.presign = { ok: false, error: error instanceof Error ? error.message : "presign failed" };
    return result;
  }
  try {
    const head = await headOriginal(key);
    result.head = head
      ? { ok: true, sizeBytes: head.sizeBytes }
      : { ok: false, error: "object not found after PUT" };
  } catch (error) {
    result.head = { ok: false, error: error instanceof Error ? error.message : "head failed" };
  }
  result.cleanup = { ok: await deleteOriginal(key) };
  return result;
}
