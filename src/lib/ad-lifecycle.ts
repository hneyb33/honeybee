import {
  finalizeCloudinaryMedia,
  uploadMediaToCloudinary,
  type FinalizeOptions,
  type RegisteredCloudinaryMedia,
  type UploadedCloudinaryAsset,
} from "@/lib/cloudinary-upload";
import { abandonMedia, refreshPendingMedia } from "@/lib/media-lifecycle";
import { adTarget, type MediaKind } from "@/lib/media-policy";

/**
 * Browser-side media helpers scoped to an ad.
 *
 * These are intentionally thin: they only point the shared Cloudinary signed
 * upload pipeline (signature -> upload -> finalize -> status) at the `ad` scope
 * instead of a listing, so ads reuse the exact same delivery model as profiles
 * without a second copy of the logic. `abandonMedia` is re-exported as-is: the
 * route already derives the scope from the public_id.
 */

export { abandonMedia };

/** Uploads one file for an ad and registers the resulting `ad_media` row. */
export async function uploadAdMedia(
  file: File,
  kind: MediaKind,
  adId: string,
  accessToken: string,
  options: {
    onProgress?: (percent: number, loadedBytes: number) => void;
    signal?: AbortSignal;
    onProcessing?: (media: RegisteredCloudinaryMedia) => void;
  } = {}
): Promise<RegisteredCloudinaryMedia> {
  const target = adTarget(adId);
  const uploaded: UploadedCloudinaryAsset = await uploadMediaToCloudinary(
    file,
    kind,
    target,
    accessToken,
    { onProgress: options.onProgress, signal: options.signal }
  );
  const finalizeOptions: FinalizeOptions = {
    signal: options.signal,
    onProcessing: options.onProcessing,
  };
  return finalizeCloudinaryMedia(target, uploaded, accessToken, finalizeOptions);
}

/** Re-checks every `ad_media` row Cloudinary has not finished with. */
export function refreshPendingAdMedia(
  adId: string,
  accessToken: string
): Promise<RegisteredCloudinaryMedia[]> {
  return refreshPendingMedia(adTarget(adId), accessToken);
}
