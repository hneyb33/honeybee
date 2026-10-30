/**
 * Cloudinary delivery URLs.
 *
 * Split from `@/lib/cloudinary` because that module pulls in `node:crypto` and
 * can only run on the server, while browsers need to build these URLs too.
 */

/**
 * Images follow Cloudinary's recommended model: upload one original and
 * transform on demand. These are the renditions Honeybee serves.
 */
export const CLOUDINARY_IMAGE_VARIANTS: Record<"card" | "detail", string> = {
  card: "c_fill,w_640,h_480,g_auto,q_auto,f_auto",
  detail: "c_limit,w_1600,h_1600,q_auto,f_auto",
};

/**
 * Inserts a transformation after the `/upload/` segment of a Cloudinary delivery
 * URL. Anything that is not a res.cloudinary.com upload URL - a legacy Supabase
 * URL, or an already-transformed URL - is returned untouched.
 */
export function withCloudinaryTransformation(
  secureUrl: string,
  transformation: string
): string {
  if (!secureUrl || !transformation) return secureUrl;
  let parsed: URL;
  try {
    parsed = new URL(secureUrl);
  } catch {
    return secureUrl;
  }
  if (parsed.hostname !== "res.cloudinary.com") return secureUrl;

  const segments = parsed.pathname.split("/");
  const uploadIndex = segments.indexOf("upload");
  if (uploadIndex < 1 || segments.length <= uploadIndex + 1) return secureUrl;
  // Already carries a transformation chain.
  if (segments[uploadIndex + 1].split(",").some((part) => /^[a-z]{2,}_/.test(part))) {
    return secureUrl;
  }
  segments.splice(uploadIndex + 1, 0, transformation);
  parsed.pathname = segments.join("/");
  return parsed.toString();
}

export function buildCloudinaryImageVariant(
  secureUrl: string,
  variant: "card" | "detail"
): string {
  return withCloudinaryTransformation(secureUrl, CLOUDINARY_IMAGE_VARIANTS[variant]);
}

export function isCloudinaryDeliveryUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
