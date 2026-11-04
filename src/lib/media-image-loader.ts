/**
 * Custom next/image loader for the Cloudflare media pipeline.
 *
 * R2 delivers only the three pre-generated fixed variants
 * (`{prefix}/thumb|card|detail.webp`); an arbitrary `?w=` must never reach
 * the origin, because unbounded resizing is exactly the transformation cost
 * trap the delivery domain is designed to avoid. So the loader simply passes
 * the already-chosen variant URL through - the component picks thumb/card/
 * detail from the row, and Cloudflare's edge cache makes each fixed URL cheap.
 *
 * Cloudinary, Unsplash and Supabase URLs are historical rows kept alive by
 * the dual-read helpers in `media-urls.ts`; they are equally untouched here.
 */

interface MediaLoaderProps {
  src: string;
  width: number;
  quality?: string | number;
}

export default function mediaImageLoader({ src }: MediaLoaderProps): string {
  return src;
}
