"use client";

import { getMediaThumbnailUrl, getMediaVideoUrl, isStreamMedia, type MediaUrlSource } from "@/lib/media-urls";
import { StreamVideoPlayer } from "@/components/media/StreamVideoPlayer";

/**
 * Provider-aware video element for a `profile_media`/`ad_media` row.
 *
 * Stream rows play through the token-minting player (their manifest is
 * signed-URLs-only); Cloudinary and legacy supabase rows keep using the plain
 * source URL exactly as before, so flipping providers never changes what the
 * directories render.
 */

interface MediaVideoProps {
  source: MediaUrlSource & { id?: unknown; stream_uid?: unknown };
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  ariaLabel?: string;
}

export function MediaVideo({ source, className, ariaLabel, ...rest }: MediaVideoProps) {
  if (isStreamMedia(source) && typeof source.id === "string") {
    return (
      <StreamVideoPlayer
        mediaId={source.id}
        poster={getMediaThumbnailUrl(source)}
        className={className}
        ariaLabel={ariaLabel}
        {...rest}
      />
    );
  }
  return (
    <video
      src={getMediaVideoUrl(source)}
      poster={getMediaThumbnailUrl(source) ?? undefined}
      controls
      playsInline
      preload="metadata"
      className={className}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}
