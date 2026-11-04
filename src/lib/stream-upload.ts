import { Upload } from "tus-js-client";
import type { MediaTarget } from "@/lib/media-policy";
import { MediaUploadError } from "@/lib/media-errors";
import {
  finalizedMediaSchema,
  type RegisteredCloudinaryMedia,
} from "@/lib/cloudinary-upload";

/**
 * Resumable video upload to Cloudflare Stream (tus protocol).
 *
 * The server route authorises the upload (ownership, state, capacity), asks
 * Stream for a one-time direct-upload target and registers the `processing`
 * row; this module only streams bytes to the returned `uploadURL`. tus
 * survives an interrupted mobile uplink: the client resumes from the last
 * acknowledged offset instead of restarting the whole file.
 */

export type RegisteredStreamMedia = RegisteredCloudinaryMedia & {
  stream_uid?: string | null;
};

interface StreamUploadResponse {
  provider: "stream";
  videoUid: string;
  uploadURL: string;
  media: unknown;
}

/** tus chunk size; Stream accepts large parts, this one balances memory. */
const TUS_CHUNK_BYTES = 8 * 1000 * 1000;

async function requestStreamTarget(
  target: MediaTarget,
  accessToken: string,
  file: File
): Promise<StreamUploadResponse> {
  let response: Response;
  try {
    response = await fetch("/api/media/stream-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...(target.scope === "ad" ? { adId: target.id } : { listingId: target.id }),
        contentType: file.type || "video/mp4",
        filename: file.name,
      }),
    });
  } catch {
    throw new MediaUploadError(
      "Could not reach Honeybee to authorise the video upload. Check your connection and try again.",
      { status: null }
    );
  }
  const payload = (await response.json().catch(() => null)) as
    | (StreamUploadResponse & { error?: string })
    | null;
  if (!response.ok || !payload || !payload.videoUid || !payload.uploadURL) {
    throw new MediaUploadError(
      payload?.error ?? "Honeybee could not authorise the video upload. Try again.",
      { status: response.status }
    );
  }
  return payload;
}

/** Best-effort cleanup of a half-finished upload; never throws. */
async function abandonStreamTarget(
  target: MediaTarget,
  accessToken: string,
  videoUid: string
): Promise<void> {
  try {
    await fetch("/api/media/abandon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        streamUid: videoUid,
        ...(target.scope === "ad" ? { adId: target.id } : { listingId: target.id }),
      }),
    });
  } catch {
    // The TTL on the upload intent frees the slot even if this cleanup fails.
  }
}

export interface StreamUploadOptions {
  file: File;
  target: MediaTarget;
  accessToken: string;
  /** 0-100, mapped straight onto the existing percent callback UX. */
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Uploads one video and resolves with the registered (still `processing`)
 * media row as soon as every byte reached Stream. Encoding finishes
 * asynchronously on Cloudflare; callers wait for `ready` through the same
 * status polling that already serves the photo pipeline.
 */
export async function uploadVideoToStream(
  options: StreamUploadOptions
): Promise<RegisteredStreamMedia> {
  const { file, target, accessToken, onProgress, signal } = options;
  const payload = await requestStreamTarget(target, accessToken, file);
  const media = finalizedMediaSchema.safeParse(payload.media);
  if (!media.success) {
    await abandonStreamTarget(target, accessToken, payload.videoUid);
    throw new MediaUploadError("Honeybee returned an unexpected video record. Try again.", {
      status: null,
    });
  }

  try {
    await runTusUpload(payload.uploadURL, file, onProgress, signal);
  } catch (error) {
    if (signal?.aborted) {
      // User-initiated removal: free the slot right away.
      await abandonStreamTarget(target, accessToken, payload.videoUid);
      throw new MediaUploadError("The video upload was cancelled.", { status: null });
    }
    throw error instanceof MediaUploadError
      ? error
      : new MediaUploadError(
          "The video upload did not finish. Check your connection and try again.",
          { status: null }
        );
  }

  return { ...media.data, stream_uid: payload.videoUid };
}

function runTusUpload(
  endpoint: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new Upload({
      file,
      url: endpoint,
      chunkSize: TUS_CHUNK_BYTES,
      retryAttempts: 3,
      onProgress(bytesSent, totalSize) {
        onProgress(totalSize > 0 ? Math.round((bytesSent / totalSize) * 100) : 0);
      },
      onSuccess() {
        resolve();
      },
      onError(error) {
        reject(error);
      },
    });

    if (signal) {
      if (signal.aborted) {
        upload.abort((err) => reject(err ?? new Error("aborted")));
        return;
      }
      signal.addEventListener(
        "abort",
        () => {
          upload.abort(() => reject(new Error("aborted")));
        },
        { once: true }
      );
    }

    upload.start();
  });
}
