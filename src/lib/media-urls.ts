export interface MediaUrlSource {
  url: unknown;
  storage_provider?: unknown;
  processing_status?: unknown;
  card_url?: unknown;
  detail_url?: unknown;
  playback_url?: unknown;
  thumbnail_url?: unknown;
}

function url(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getMediaImageUrl(
  media: MediaUrlSource,
  variant: "card" | "detail"
): string {
  const original = url(media.url) ?? "";
  if (media.storage_provider !== "cloudinary") return original;

  const cardUrl = url(media.card_url);
  const detailUrl = url(media.detail_url);
  return variant === "card"
    ? cardUrl ?? detailUrl ?? original
    : detailUrl ?? cardUrl ?? original;
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
