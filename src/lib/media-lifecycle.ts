import { z } from "zod";
import { finalizedMediaSchema, type RegisteredCloudinaryMedia } from "@/lib/cloudinary-upload";
import { MediaUploadError } from "@/lib/media-errors";
import { type MediaTarget } from "@/lib/media-policy";

/**
 * Browser-side calls for the media lifecycle endpoints that sit around the
 * upload itself: removing an asset and re-checking one Cloudinary is still
 * processing.
 */

const refreshSchema = z.object({ media: z.array(finalizedMediaSchema) });

async function postJson(
  url: string,
  body: unknown,
  accessToken: string,
  fallbackMessage: string
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new MediaUploadError("Could not reach Honeybee. Check your connection.", { status: null });
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: unknown }).error
      : null;
    throw new MediaUploadError(
      typeof error === "string" ? error : `${fallbackMessage} (HTTP ${response.status})`,
      { status: response.status }
    );
  }
  return payload;
}

/**
 * Deletes a Cloudinary asset plus its row and upload intent so a portfolio slot
 * becomes free again. A 404 means the asset is already gone, which is success.
 */
export async function abandonMedia(publicId: string, accessToken: string): Promise<void> {
  await postJson("/api/media/abandon", { publicId }, accessToken, "That media could not be removed");
}

/** Any one identity column that names an in-flight or registered asset. */
export interface MediaAssetIdentity {
  publicId?: string | null;
  mediaKey?: string | null;
  streamUid?: string | null;
}

/**
 * Provider-aware removal: routes the abandon call with whichever identifier
 * the upload produced (Cloudinary public id, R2 media key or Stream uid). A
 * 404 is success; the caller only needs the slot freed.
 */
export async function abandonMediaAsset(
  identity: MediaAssetIdentity,
  target: MediaTarget | null,
  accessToken: string
): Promise<void> {
  const { publicId, mediaKey, streamUid } = identity;
  let body: Record<string, string>;
  if (mediaKey) {
    body = { mediaKey };
  } else if (streamUid) {
    if (!target) {
      throw new MediaUploadError("Stream removals must name the owning listing or ad.", {
        status: null,
      });
    }
    body = { streamUid, ...targetBody(target) };
  } else if (publicId) {
    body = { publicId };
  } else {
    return; // Nothing uploaded yet - no server-side residue to remove.
  }
  await postJson("/api/media/abandon", body, accessToken, "That media could not be removed");
}

function targetBody(target: MediaTarget): Record<string, string> {
  return target.scope === "ad" ? { adId: target.id } : { listingId: target.id };
}

/** Re-checks every media row Cloudinary has not finished with. */
export async function refreshPendingMedia(
  target: MediaTarget,
  accessToken: string
): Promise<RegisteredCloudinaryMedia[]> {
  const payload = await postJson(
    "/api/media/status",
    target.scope === "ad" ? { adId: target.id } : { listingId: target.id },
    accessToken,
    "Media status could not be checked"
  );
  const parsed = refreshSchema.safeParse(payload);
  if (!parsed.success) {
    throw new MediaUploadError("Honeybee returned an incomplete media status.", {
      detail: parsed.error.issues.map((issue) => issue.message).join(", "),
    });
  }
  return parsed.data.media;
}
