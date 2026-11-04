import { buildCloudinaryImageVariant } from "@/lib/cloudinary-url";

export interface MediaUrlSource {
  url: unknown;
  storage_provider?: unknown;
  processing_status?: unknown;
  card_url?: unknown;
  detail_url?: unknown;
  playback_url?: unknown;
  thumbnail_url?: unknown;
  original_url?: unknown;
  moderation_status?: unknown;
}

function url(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Dual-read image resolution. R2 rows carry pre-generated variant URLs
 * (thumb/card/detail - fixed sizes only, immutable caching), so a stored URL
 * is always the right one and no on-the-fly sizing is possible by design.
 * Cloudinary rows store rendition URLs, but a row written before the
 * on-demand pipeline only has the original; building the missing variant from
 * it keeps every historical row rendering at the right size instead of
 * falling back to a multi-megabyte upload. Legacy supabase rows are untouched.
 */
export function getMediaImageUrl(
  media: MediaUrlSource,
  variant: "card" | "detail"
): string {
  const original = url(media.url) ?? "";
  if (media.storage_provider === "r2") {
    const stored = variant === "card" ? url(media.card_url) : url(media.detail_url);
    return stored ?? original;
  }
  if (media.storage_provider !== "cloudinary") return original;

  const stored = variant === "card" ? url(media.card_url) : url(media.detail_url);
  if (stored) return stored;

  const fallback = url(media.original_url) ?? url(media.detail_url) ?? url(media.card_url) ?? original;
  return fallback ? buildCloudinaryImageVariant(fallback, variant) : original;
}

export function getMediaVideoUrl(media: MediaUrlSource): string {
  const original = url(media.url) ?? "";
  if (media.storage_provider === "stream") {
    // The stored manifest is only fetchable with a short-lived token; render
    // Stream videos through <MediaVideo>, which mints one per session. This
    // return value keeps non-playback contexts (links, fallbacks) non-empty.
    return url(media.playback_url) ?? original;
  }
  return media.storage_provider === "cloudinary"
    ? url(media.playback_url) ?? url(media.original_url) ?? original
    : original;
}

export function getMediaThumbnailUrl(media: MediaUrlSource): string | null {
  return url(media.thumbnail_url);
}

/** `true` when the row is a Stream video that needs a playback token. */
export function isStreamMedia(media: MediaUrlSource & { stream_uid?: unknown }): boolean {
  return media.storage_provider === "stream" && typeof media.stream_uid === "string";
}

/**
 * Media is renderable when its delivery form exists. Cloudinary photos are
 * ready the moment finalize lands (renditions are generated on demand), and
 * legacy videos keep streaming their original upload form while the optimised
 * renditions transcode. R2/Stream rows are hidden until the queue worker or
 * the encoding webhook flips them to `ready`; once moderation has explicitly
 * rejected a new-provider row it disappears everywhere. The explicit-
 * rejection rule is deliberate: every legacy row carries the default
 * `pending` status, and demanding `approved` would empty the directories.
 */
export function isPublicMediaReady(media: MediaUrlSource): boolean {
  if (media.processing_status === "failed") return false;
  const provider = media.storage_provider;
  if (provider === "r2" || provider === "stream") {
    return media.processing_status === "ready" && media.moderation_status !== "rejected";
  }
  return true;
}
