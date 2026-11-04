"use client";

import { useEffect, useRef } from "react";
import { decode } from "blurhash";

/**
 * BlurHash placeholder shown while an asset is still `processing` (the queue
 * worker has not flipped it to `ready` yet) or while the real image loads.
 * The hash was computed by the worker from a 32px decode of the original, so
 * this canvas stays tiny and cheap.
 */

interface BlurHashFallbackProps {
  hash: string | null | undefined;
  className?: string;
  /** Render size in pixels; the blur hides any coarseness. */
  width?: number;
  height?: number;
}

export function BlurHashFallback({
  hash,
  className,
  width = 32,
  height = 32,
}: BlurHashFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hash) return;
    try {
      const pixels = decode(hash, width, height);
      const context = canvas.getContext("2d");
      if (!context) return;
      const imageData = context.createImageData(width, height);
      imageData.data.set(pixels);
      context.putImageData(imageData, 0, 0);
    } catch {
      // A malformed hash only loses the placeholder, never the asset.
    }
  }, [hash, width, height]);

  if (!hash) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden
      className={className}
      style={{ imageRendering: "auto" }}
    />
  );
}
