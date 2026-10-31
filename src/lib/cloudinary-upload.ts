import { z } from "zod";
import {
  CHUNKED_UPLOAD_MIN_BYTES,
  UPLOAD_CHUNK_BYTES,
  resourceTypeForKind,
  type CloudinaryResourceType,
  type MediaKind,
  type MediaTarget,
} from "@/lib/media-policy";
import {
  MediaUploadError,
  describeCloudinaryFailure,
  extractCloudinaryMessage,
  isAbortError,
} from "@/lib/media-errors";

const signatureSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int(),
  params: z.record(z.union([z.string(), z.number()])),
  signature: z.string().min(1),
  resourceType: z.enum(["image", "video"]),
  publicId: z.string().min(1),
});

const uploadResultSchema = z.object({
  public_id: z.string().min(1),
  asset_id: z.string().min(1).max(128),
});

export const finalizedMediaSchema = z.object({
  id: z.string().uuid(),
  // A finalized row belongs to either a listing or an ad; only one is present.
  listing_id: z.string().uuid().nullable().optional(),
  ad_id: z.string().uuid().nullable().optional(),
  url: z.string().url(),
  kind: z.enum(["photo", "video"]),
  sort_order: z.number().int(),
  thumbnail_url: z.string().url().nullable(),
  processing_status: z.enum(["pending", "processing", "ready", "failed"]),
  cloudinary_public_id: z.string().nullable().optional(),
  cloudinary_asset_id: z.string().nullable().optional(),
  card_url: z.string().url().nullable().optional(),
  detail_url: z.string().url().nullable().optional(),
  playback_url: z.string().url().nullable().optional(),
});

export type UploadedCloudinaryAsset = {
  publicId: string;
  assetId: string;
  kind: MediaKind;
  resourceType: CloudinaryResourceType;
};

export type RegisteredCloudinaryMedia = z.infer<typeof finalizedMediaSchema>;

type UploadSignature = z.infer<typeof signatureSchema>;

/** Cloudinary signatures are time-boxed, so each chunk gets a fresh one. */
const AUTHORIZATION_LEASE_MS = 4 * 60 * 1000;
const CHUNK_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_CHUNK_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1200;
const PROCESSING_POLL_INTERVAL_MS = 3000;
const MAX_PROCESSING_POLL_INTERVAL_MS = 15000;
/** How long to wait for video transcoding before letting the wizard continue. */
const PROCESSING_GRACE_MS = 90 * 1000;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 420 || status === 425 || status === 429 || status >= 500;
}

function signatureAgeMs(signature: UploadSignature): number {
  return Date.now() - signature.timestamp * 1000;
}

async function requestUploadSignature(
  target: MediaTarget,
  kind: MediaKind,
  accessToken: string,
  publicId?: string
): Promise<UploadSignature> {
  let response: Response;
  try {
    response = await fetch("/api/media/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...(target.scope === "ad" ? { adId: target.id } : { listingId: target.id }),
        resourceType: resourceTypeForKind(kind),
        ...(publicId ? { publicId } : {}),
      }),
    });
  } catch {
    throw new MediaUploadError(
      "Could not reach Honeybee to authorise the upload. Check your connection and try again.",
      { status: null }
    );
  }

  const contentType = response.headers.get("content-type");
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }

  if (!response.ok || !payload) {
    const described = describeCloudinaryFailure({
      status: response.status,
      statusText: response.statusText,
      contentType,
      cloudinaryMessage: extractCloudinaryMessage(payload),
      bodySnippet: text.slice(0, 180),
    });
    throw new MediaUploadError(
      response.status === 503 && payload === null
        ? described.message
        : described.message,
      { detail: described.detail, status: response.status }
    );
  }

  const parsed = signatureSchema.safeParse(payload);
  if (!parsed.success) {
    throw new MediaUploadError("The upload authorization response is invalid.", {
      detail: parsed.error.issues.map((issue) => issue.message).join(", "),
      status: response.status,
    });
  }
  return parsed.data;
}

function uploadChunk(
  file: File,
  signature: UploadSignature,
  start: number,
  end: number,
  uploadId: string | null,
  signal: AbortSignal | undefined,
  onLoaded: (loaded: number) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file.slice(start, end + 1), file.name);
    form.append("api_key", signature.apiKey);
    form.append("signature", signature.signature);
    for (const [key, value] of Object.entries(signature.params)) {
      form.append(key, String(value));
    }

    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${signature.resourceType}/upload`
    );
    request.timeout = CHUNK_TIMEOUT_MS;
    if (uploadId) {
      request.setRequestHeader("X-Unique-Upload-Id", uploadId);
      request.setRequestHeader("Content-Range", `bytes ${start}-${end}/${file.size}`);
    }
    request.upload.onprogress = (event) => {
      onLoaded(start + (event.lengthComputable ? event.loaded : 0));
    };
    const finish = (error: Error | null, payload?: unknown) => {
      signal?.removeEventListener("abort", onAborted);
      if (error) reject(error);
      else resolve(payload);
    };
    const onAborted = () => {
      request.abort();
      finish(new MediaUploadError("The upload was cancelled.", { status: null }));
    };
    signal?.addEventListener("abort", onAborted, { once: true });

    request.onerror = () =>
      finish(new MediaUploadError(
        "Could not reach Cloudinary. Check your connection, VPN or firewall and try again.",
        { status: null, retryable: true }
      ));
    request.ontimeout = () =>
      finish(new MediaUploadError(
        "Cloudinary stopped responding to the upload. Your connection may have dropped.",
        { status: 408, retryable: true }
      ));
    request.onload = () => {
      let contentType: string | null = null;
      let cldError: string | null = null;
      try {
        contentType = request.getResponseHeader("content-type");
        cldError = request.getResponseHeader("x-cld-error");
      } catch {
        // Cross-origin header access is limited; the body still tells us enough.
      }

      let payload: unknown = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = null;
      }

      if (request.status < 200 || request.status >= 300) {
        const described = describeCloudinaryFailure({
          status: request.status,
          statusText: request.statusText,
          contentType,
          cloudinaryMessage: extractCloudinaryMessage(payload),
          cldErrorHeader: cldError,
          bodySnippet: payload === null ? request.responseText.slice(0, 180) : null,
        });
        const error = new MediaUploadError(described.message, {
          detail: described.detail,
          status: request.status,
          retryable: isRetryableStatus(request.status),
        });
        finish(error);
        return;
      }
      if (payload === null) {
        finish(new MediaUploadError(
          "Cloudinary replied to the upload with an unreadable response.",
          { detail: request.responseText.slice(0, 180), status: request.status }
        ));
        return;
      }
      finish(null, payload);
    };
    request.send(form);
  });
}

interface UploadOptions {
  onProgress?: (percent: number, loadedBytes: number) => void;
  signal?: AbortSignal;
}

export async function uploadMediaToCloudinary(
  file: File,
  kind: MediaKind,
  target: MediaTarget,
  accessToken: string,
  options: UploadOptions = {}
): Promise<UploadedCloudinaryAsset> {
  const { onProgress, signal } = options;
  let signature = await requestUploadSignature(target, kind, accessToken);
  const chunked = file.size > CHUNKED_UPLOAD_MIN_BYTES;
  const uploadId = chunked ? crypto.randomUUID() : null;

  const report = (loaded: number) => {
    onProgress?.(
      Math.min(100, Math.round((loaded / Math.max(file.size, 1)) * 100)),
      loaded
    );
  };

  const boundaries: Array<[number, number]> = [];
  if (chunked) {
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + UPLOAD_CHUNK_BYTES, file.size) - 1;
      boundaries.push([start, end]);
      start = end + 1;
    }
  } else {
    boundaries.push([0, file.size - 1]);
  }

  let result: unknown = null;
  for (let index = 0; index < boundaries.length; index += 1) {
    const [start, end] = boundaries[index];
    let attempt = 0;
    while (true) {
      if (signal?.aborted) throw new MediaUploadError("The upload was cancelled.", { status: null });
      // Re-authorise for every chunk after the first, and whenever the current
      // lease is close to expiring, so a slow uplink never voids the signature.
      if (index > 0 || signatureAgeMs(signature) > AUTHORIZATION_LEASE_MS) {
        signature = await requestUploadSignature(
          target,
          kind,
          accessToken,
          signature.publicId
        );
      }
      try {
        result = await uploadChunk(file, signature, start, end, uploadId, signal, report);
        break;
      } catch (error) {
        if (isAbortError(error)) throw error;
        attempt += 1;
        const retryable = error instanceof MediaUploadError && error.retryable;
        if (!retryable || attempt >= MAX_CHUNK_ATTEMPTS) {
          throw error;
        }
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), signal);
      }
    }
  }

  const uploadResult = uploadResultSchema.safeParse(result);
  if (!uploadResult.success || uploadResult.data.public_id !== signature.publicId) {
    throw new MediaUploadError("Cloudinary did not confirm the authorized upload.", {
      detail: uploadResult.success ? "" : (uploadResult.error.issues[0]?.message ?? ""),
    });
  }

  onProgress?.(100, file.size);
  return {
    publicId: uploadResult.data.public_id,
    assetId: uploadResult.data.asset_id,
    kind,
    resourceType: resourceTypeForKind(kind),
  };
}

export interface FinalizeOptions {
  /** Streamed while a video is still transcoding so the UI can show progress. */
  onProcessing?: (media: RegisteredCloudinaryMedia) => void;
  signal?: AbortSignal;
  /** Set for the legacy retry path where the browser holds no lease info. */
  leaseMs?: number;
}

/**
 * Registers an uploaded asset. Images are ready immediately because their
 * renditions are generated on delivery. Videos wait for the asynchronous
 * transcode, and if it is still running after the grace period the pending row
 * is returned rather than failing the whole wizard - the next save, or a page
 * revisit, re-checks it.
 */
export async function finalizeCloudinaryMedia(
  target: MediaTarget,
  asset: UploadedCloudinaryAsset,
  accessToken: string,
  onProcessing?: ((media: RegisteredCloudinaryMedia) => void) | FinalizeOptions,
  finalizeOptions: FinalizeOptions = {}
): Promise<RegisteredCloudinaryMedia> {
  const options: FinalizeOptions = typeof onProcessing === "function"
    ? { ...finalizeOptions, onProcessing }
    : { ...finalizeOptions, ...(onProcessing ?? {}) };
  const deadline = Date.now() + (options.leaseMs ?? PROCESSING_GRACE_MS);
  let pollInterval = PROCESSING_POLL_INTERVAL_MS;

  while (true) {
    if (options.signal?.aborted) throw new MediaUploadError("Media registration was cancelled.", { status: null });
    let response: Response;
    try {
      response = await fetch("/api/media/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...(target.scope === "ad" ? { adId: target.id } : { listingId: target.id }),
          resourceType: asset.resourceType,
          publicId: asset.publicId,
          assetId: asset.assetId,
        }),
      });
    } catch {
      throw new MediaUploadError(
        "Could not reach Honeybee to register the uploaded media. Check your connection.",
        { status: null }
      );
    }

    const contentType = response.headers.get("content-type");
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    if (response.status === 202) {
      const pending = z.object({ media: finalizedMediaSchema }).safeParse(payload);
      if (!pending.success) {
        throw new MediaUploadError("Honeybee returned an invalid processing status.", {
          detail: text.slice(0, 180),
          status: response.status,
        });
      }
      options.onProcessing?.(pending.data.media);
      if (Date.now() >= deadline) {
        // Not a failure: the video is queued, the profile can still be saved.
        return pending.data.media;
      }
      await delay(pollInterval, options.signal);
      pollInterval = Math.min(Math.round(pollInterval * 1.5), MAX_PROCESSING_POLL_INTERVAL_MS);
      continue;
    }

    if (!response.ok) {
      const described = describeCloudinaryFailure({
        status: response.status,
        statusText: response.statusText,
        contentType,
        cloudinaryMessage: extractCloudinaryMessage(payload) ??
          (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : null),
        bodySnippet: payload === null ? text.slice(0, 180) : null,
      });
      throw new MediaUploadError(described.message, {
        detail: described.detail,
        status: response.status,
      });
    }

    const finalized = z.object({ media: finalizedMediaSchema }).safeParse(payload);
    if (!finalized.success) {
      throw new MediaUploadError("Honeybee returned an incomplete media record.", {
        detail: finalized.error.issues.map((issue) => issue.message).join(", ") || text.slice(0, 180),
        status: response.status,
      });
    }
    return finalized.data.media;
  }
}
