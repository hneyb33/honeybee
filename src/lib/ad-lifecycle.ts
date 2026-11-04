import {
  finalizeMedia,
  uploadMedia,
  type FinalizeOptions,
  type RegisteredMedia,
} from "@/lib/media-upload";
import { abandonMediaAsset, refreshPendingMedia } from "@/lib/media-lifecycle";
import { adTarget, type MediaKind } from "@/lib/media-policy";

/**
 * Browser-side media helpers scoped to an ad.
 *
 * These are intentionally thin: they only point the shared upload pipeline
 * (authorise -> upload -> finalize -> status) at the `ad` scope instead of a
 * listing, so ads reuse the exact same delivery model as profiles without a
 * second copy of the logic.
 */

/** Removes an ad asset by whichever provider identity the row carries. */
export function abandonAdMedia(
  identity: { publicId?: string | null; mediaKey?: string | null; streamUid?: string | null },
  adId: string,
  accessToken: string
): Promise<void> {
  return abandonMediaAsset(identity, adTarget(adId), accessToken);
}

/** Uploads one file for an ad and registers the resulting `ad_media` row. */
export async function uploadAdMedia(
  file: File,
  kind: MediaKind,
  adId: string,
  accessToken: string,
  options: {
    onProgress?: (percent: number, loadedBytes: number) => void;
    signal?: AbortSignal;
    onProcessing?: (media: RegisteredMedia) => void;
  } = {}
): Promise<RegisteredMedia> {
  const target = adTarget(adId);
  const uploaded = await uploadMedia(file, kind, target, accessToken, {
    onProgress: options.onProgress,
    signal: options.signal,
  });
  const finalizeOptions: FinalizeOptions = {
    signal: options.signal,
    onProcessing: options.onProcessing,
  };
  return finalizeMedia(target, uploaded, accessToken, finalizeOptions);
}

/** Re-checks every `ad_media` row the provider has not finished with. */
export function refreshPendingAdMedia(
  adId: string,
  accessToken: string
): Promise<RegisteredMedia[]> {
  return refreshPendingMedia(adTarget(adId), accessToken);
}
