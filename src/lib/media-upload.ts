import { z } from "zod";
import {
  finalizeCloudinaryMedia,
  finalizedMediaSchema,
  uploadMediaToCloudinary,
  type FinalizeOptions,
  type RegisteredCloudinaryMedia,
  type UploadedCloudinaryAsset,
} from "@/lib/cloudinary-upload";
import { MediaUploadError, isAbortError } from "@/lib/media-errors";
import {
  resourceTypeForKind,
  type CloudinaryResourceType,
  type MediaKind,
  type MediaTarget,
} from "@/lib/media-policy";
import { uploadVideoToStream } from "@/lib/stream-upload";
import { refreshPendingMedia } from "@/lib/media-lifecycle";

/**
 * Provider-agnostic media upload entry point.
 *
 * Photos: one presigned PUT against the R2 originals bucket (re-leased on
 * retry, 3 attempts) followed by the finalize poll - identical outcomes to the
 * legacy Cloudinary flow, so the queue UI never branches on provider.
 * Videos: resumable tus upload straight to Cloudflare Stream; the encoding
 * webhook flips the row, and this module waits on the same status endpoint.
 *
 * While a deployment still points at Cloudinary (no R2/Stream credentials),
 * every call transparently falls back to the legacy implementation, which is
 * what keeps the Vercel dual-run working until the cutover.
 */

export type RegisteredMedia = RegisteredCloudinaryMedia;
export type { FinalizeOptions };
export { finalizedMediaSchema };

export type UploadedMediaAsset =
  | {
      provider: "cloudinary";
      publicId: string;
      assetId: string;
      kind: MediaKind;
      resourceType: CloudinaryResourceType;
    }
  | {
      provider: "r2";
      mediaKey: string;
      assetId: string;
      kind: MediaKind;
      resourceType: CloudinaryResourceType;
    }
  | {
      /** Stream rows are registered by the upload route itself. */
      provider: "stream";
      streamUid: string;
      registered: RegisteredMedia;
      kind: MediaKind;
      resourceType: CloudinaryResourceType;
    };

const r2SignatureSchema = z.object({
  provider: z.literal("r2"),
  mediaKey: z.string().min(1),
  assetId: z.string().min(1),
  uploadUrl: z.string().url(),
  method: z.literal("PUT"),
  contentType: z.string().min(1),
  expiresIn: z.number(),
});

type R2Signature = z.infer<typeof r2SignatureSchema>;

const MAX_PUT_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1200;
const PROCESSING_POLL_INTERVAL_MS = 3000;
const MAX_PROCESSING_POLL_INTERVAL_MS = 15000;
const PROCESSING_GRACE_MS = 90 * 1000;

function targetBody(target: MediaTarget): Record<string, string> {
  return target.scope === "ad" ? { adId: target.id } : { listingId: target.id };
}

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

async function requestPresign(
  target: MediaTarget,
  accessToken: string,
  file: File,
  mediaKey?: string
): Promise<R2Signature | null> {
  const response = await fetch("/api/media/signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ...targetBody(target),
      resourceType: "image",
      contentType: file.type || "image/jpeg",
      ...(mediaKey ? { mediaKey } : {}),
    }),
  }).catch(() => {
    throw new MediaUploadError(
      "Could not reach Honeybee to authorise the upload. Check your connection and try again.",
      { status: null }
    );
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: unknown }).error
      : null;
    throw new MediaUploadError(
      typeof error === "string" ? error : "Honeybee could not authorise the upload. Try again.",
      { status: response.status }
    );
  }
  // The legacy Cloudinary answer carries no `provider` marker.
  const parsed = r2SignatureSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

function presignedPut(
  signature: R2Signature,
  file: File,
  signal: AbortSignal | undefined,
  onLoaded: (loadedBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(signature.method, signature.uploadUrl);
    request.timeout = 5 * 60 * 1000;
    request.setRequestHeader("Content-Type", signature.contentType);
    request.upload.onprogress = (event) => {
      onLoaded(event.lengthComputable ? event.loaded : 0);
    };
    const finish = (error: Error | null) => {
      signal?.removeEventListener("abort", onAborted);
      if (error) reject(error);
      else resolve();
    };
    const onAborted = () => {
      request.abort();
      finish(new MediaUploadError("The upload was cancelled.", { status: null }));
    };
    signal?.addEventListener("abort", onAborted, { once: true });

    request.onerror = () =>
      finish(new MediaUploadError(
        "Could not reach the storage service. Check your connection and try again.",
        { status: null, retryable: true }
      ));
    request.ontimeout = () =>
      finish(new MediaUploadError(
        "The storage service stopped responding to the upload. Your connection may have dropped.",
        { status: 408, retryable: true }
      ));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        finish(null);
        return;
      }
      finish(new MediaUploadError(
        "The storage service refused the upload. Try again.",
        { status: request.status, retryable: request.status === 408 || request.status === 429 || request.status >= 500 }
      ));
    };
    request.send(file);
  });
}

async function uploadPhoto(
  file: File,
  target: MediaTarget,
  accessToken: string,
  options: { onProgress?: (percent: number, loadedBytes: number) => void; signal?: AbortSignal }
): Promise<UploadedMediaAsset> {
  let signature = await requestPresign(target, accessToken, file);
  if (!signature) {
    // Deployment without R2 credentials: the full legacy flow takes over.
    const legacy = await uploadMediaToCloudinary(file, "photo", target, accessToken, options);
    return { ...legacy, provider: "cloudinary" };
  }

  const report = (loaded: number) => {
    options.onProgress?.(
      Math.min(100, Math.round((loaded / Math.max(file.size, 1)) * 100)),
      loaded
    );
  };

  let attempt = 0;
  while (true) {
    if (options.signal?.aborted) {
      throw new MediaUploadError("The upload was cancelled.", { status: null });
    }
    try {
      await presignedPut(signature, file, options.signal, report);
      break;
    } catch (error) {
      if (isAbortError(error) || options.signal?.aborted) throw error;
      attempt += 1;
      const retryable = error instanceof MediaUploadError && (error.retryable || error.status === null);
      if (!retryable || attempt >= MAX_PUT_ATTEMPTS) throw error;
      // Re-lease: presigned URLs are short-lived, so a retry always uploads
      // against a freshly signed target for the same immutable key.
      await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), options.signal);
      const refreshed = await requestPresign(target, accessToken, file, signature.mediaKey);
      if (!refreshed) throw error;
      signature = refreshed;
    }
  }

  return {
    provider: "r2",
    mediaKey: signature.mediaKey,
    assetId: signature.assetId,
    kind: "photo",
    resourceType: "image",
  };
}

async function uploadVideo(
  file: File,
  target: MediaTarget,
  accessToken: string,
  options: { onProgress?: (percent: number, loadedBytes: number) => void; signal?: AbortSignal }
): Promise<UploadedMediaAsset> {
  try {
    const registered = await uploadVideoToStream({
      file,
      target,
      accessToken,
      onProgress: (percent) => options.onProgress?.(percent, percent * 1000),
      signal: options.signal,
    });
    return {
      provider: "stream",
      streamUid: registered.stream_uid ?? "",
      registered,
      kind: "video",
      resourceType: "video",
    };
  } catch (error) {
    const status = error instanceof MediaUploadError ? error.status : null;
    // 404 = deployment predates the Stream routes; 503 = Stream credentials
    // are missing. Both mean "this environment still runs the legacy flow".
    if (status === 404 || status === 503) {
      const legacy = await uploadMediaToCloudinary(file, "video", target, accessToken, options);
      return { ...legacy, provider: "cloudinary" };
    }
    throw error;
  }
}

export async function uploadMedia(
  file: File,
  kind: MediaKind,
  target: MediaTarget,
  accessToken: string,
  options: { onProgress?: (percent: number, loadedBytes: number) => void; signal?: AbortSignal } = {}
): Promise<UploadedMediaAsset> {
  return kind === "photo"
    ? uploadPhoto(file, target, accessToken, options)
    : uploadVideo(file, target, accessToken, options);
}

async function finalizePresignedPhoto(
  target: MediaTarget,
  asset: Extract<UploadedMediaAsset, { provider: "r2" }>,
  accessToken: string,
  options: FinalizeOptions
): Promise<RegisteredMedia> {
  const deadline = Date.now() + (options.leaseMs ?? PROCESSING_GRACE_MS);
  let pollInterval = PROCESSING_POLL_INTERVAL_MS;

  while (true) {
    if (options.signal?.aborted) {
      throw new MediaUploadError("Media registration was cancelled.", { status: null });
    }
    let response: Response;
    try {
      response = await fetch("/api/media/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...targetBody(target),
          resourceType: asset.resourceType,
          mediaKey: asset.mediaKey,
          assetId: asset.assetId,
        }),
        cache: "no-store",
      });
    } catch {
      throw new MediaUploadError(
        "Could not reach Honeybee to register the uploaded media. Check your connection.",
        { status: null }
      );
    }

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
      if (Date.now() >= deadline) return pending.data.media;
      await delay(pollInterval, options.signal);
      pollInterval = Math.min(Math.round(pollInterval * 1.5), MAX_PROCESSING_POLL_INTERVAL_MS);
      continue;
    }

    if (!response.ok) {
      const error = payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: unknown }).error
        : null;
      throw new MediaUploadError(
        typeof error === "string" ? error : `Media registration failed (HTTP ${response.status}).`,
        { status: response.status }
      );
    }

    const finalized = z.object({ media: finalizedMediaSchema }).safeParse(payload);
    if (!finalized.success) {
      throw new MediaUploadError("Honeybee returned an incomplete media record.", {
        detail: finalized.error.issues.map((issue) => issue.message).join(", "),
        status: response.status,
      });
    }
    return finalized.data.media;
  }
}

/**
 * Stream encoding finishes on its own clock; the tus upload already created
 * the row, so "finalize" means waiting for the webhook flip within the same
 * grace period the legacy video flow used.
 */
async function waitForStreamReady(
  target: MediaTarget,
  asset: Extract<UploadedMediaAsset, { provider: "stream" }>,
  accessToken: string,
  options: FinalizeOptions
): Promise<RegisteredMedia> {
  const deadline = Date.now() + (options.leaseMs ?? PROCESSING_GRACE_MS);
  let pollInterval = PROCESSING_POLL_INTERVAL_MS;
  let latest: RegisteredMedia = asset.registered;

  while (Date.now() < deadline) {
    if (options.signal?.aborted) {
      throw new MediaUploadError("Media registration was cancelled.", { status: null });
    }
    try {
      const rows = await refreshPendingMedia(target, accessToken);
      const mine = rows.find((row) => row.id === asset.registered.id);
      if (!mine) {
        // Gone from pending: either the webhook flipped it (the next list read
        // shows `ready`) or it was removed - the wizard can continue either way.
        return { ...latest, processing_status: "ready" };
      }
      latest = mine;
      if (mine.processing_status === "ready") return mine;
      if (mine.processing_status === "failed") {
        throw new MediaUploadError(
          "The video could not be processed. Try uploading a different file.",
          { status: null }
        );
      }
    } catch (error) {
      if (error instanceof MediaUploadError && error.status === null) throw error;
      // A failed poll must not fail the upload itself.
    }
    options.onProcessing?.(latest);
    await delay(pollInterval, options.signal);
    pollInterval = Math.min(Math.round(pollInterval * 1.5), MAX_PROCESSING_POLL_INTERVAL_MS);
  }
  return latest;
}

export async function finalizeMedia(
  target: MediaTarget,
  asset: UploadedMediaAsset,
  accessToken: string,
  onProcessing?: ((media: RegisteredMedia) => void) | FinalizeOptions,
  finalizeOptions: FinalizeOptions = {}
): Promise<RegisteredMedia> {
  const options: FinalizeOptions = typeof onProcessing === "function"
    ? { ...finalizeOptions, onProcessing }
    : { ...finalizeOptions, ...(onProcessing ?? {}) };

  if (asset.provider === "stream") {
    return waitForStreamReady(target, asset, accessToken, options);
  }
  if (asset.provider === "r2") {
    return finalizePresignedPhoto(target, asset, accessToken, options);
  }
  const legacy: UploadedCloudinaryAsset = {
    publicId: asset.publicId,
    assetId: asset.assetId,
    kind: asset.kind,
    resourceType: asset.resourceType,
  };
  return finalizeCloudinaryMedia(target, legacy, accessToken, options);
}
