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
}

function url(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Cloudinary rows store the rendition URLs, but a row written before the
 * on-demand pipeline only has the original. Building the missing variant from
 * the original keeps every historical row rendering at the right size instead
 * of falling back to a multi-megabyte upload.
 */
export function getMediaImageUrl(
  media: MediaUrlSource,
  variant: "card" | "detail"
): string {
  const original = url(media.url) ?? "";
  if (media.storage_provider !== "cloudinary") return original;

  const stored = variant === "card" ? url(media.card_url) : url(media.detail_url);
  if (stored) return stored;

  const fallback = url(media.original_url) ?? url(media.detail_url) ?? url(media.card_url) ?? original;
  return fallback ? buildCloudinaryImageVariant(fallback, variant) : original;
}

export function getMediaVideoUrl(media: MediaUrlSource): string {
  const original = url(media.url) ?? "";
  return media.storage_provider === "cloudinary"
    ? url(media.playback_url) ?? original
    : original;
}

export function getMediaThumbnailUrl(media: MediaUrlSource): string | null {
  return url(media.thumbnail_url);
}

export function isPublicMediaReady(media: MediaUrlSource): boolean {
  return media.storage_provider !== "cloudinary" || media.processing_status === "ready";
}
