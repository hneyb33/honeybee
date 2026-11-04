"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

/**
 * Cloudflare Stream playback for a `storage_provider === "stream"` row.
 *
 * Every video is uploaded with `requireSignedURLs`, so the manifest stored in
 * the database is not fetchable on its own. On mount (or when the media id
 * changes) this component asks `/api/media/stream-token` for a short-lived
 * token and plays the signed manifest - natively where HLS is built in
 * (Safari), through hls.js everywhere else. A fresh token is minted per
 * playback session, never reused past its expiry.
 */

interface StreamVideoPlayerProps {
  /** The `profile_media`/`ad_media` row id the token endpoint expects. */
  mediaId: string;
  poster?: string | null;
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  ariaLabel?: string;
}

export function StreamVideoPlayer({
  mediaId,
  poster,
  className,
  controls = true,
  playsInline = true,
  preload = "metadata",
  ariaLabel,
}: StreamVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/media/stream-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId }),
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { playbackUrl?: string; error?: string }
          | null;
        if (cancelled) return;
        if (!response.ok || !payload?.playbackUrl) {
          setError(payload?.error ?? "This video could not be started.");
          return;
        }
        setPlaybackUrl(payload.playbackUrl);
      } catch {
        if (!cancelled) setError("Could not reach Honeybee to start the video.");
      }
    }

    setPlaybackUrl(null);
    setError(null);
    void load();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;
    let player: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari plays HLS natively; no bundled player needed.
      video.src = playbackUrl;
      return;
    }
    if (Hls.isSupported()) {
      player = new Hls({ enableWorker: true });
      player.loadSource(playbackUrl);
      player.attachMedia(video);
      return () => {
        player?.destroy();
        player = null;
      };
    }
    setError("This browser cannot play the video.");
    return undefined;
  }, [playbackUrl]);

  if (error) {
    return (
      <div
        className={className}
        role="note"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#a3a3a3",
          fontSize: "0.8rem",
          textAlign: "center",
          padding: "0.75rem",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={poster ?? undefined}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
