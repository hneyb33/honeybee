import { createHash } from "node:crypto";
import {
  mimeTypeForFormat,
  policyForResourceType,
  type CloudinaryResourceType,
} from "@/lib/media-policy";

export type { CloudinaryResourceType };
export {
  CLOUDINARY_IMAGE_VARIANTS,
  buildCloudinaryImageVariant,
  withCloudinaryTransformation,
} from "@/lib/cloudinary-url";

/**
 * Images follow Cloudinary's recommended pattern: upload one high-quality
 * original and transform on demand (see `CLOUDINARY_IMAGE_VARIANTS`), so
 * nothing is pre-generated at upload time.
 *
 * Videos are different: playback has to be transcoded before a browser can
 * stream it, so the MP4 and poster renditions are generated asynchronously as
 * eager transformations.
 */
export const CLOUDINARY_EAGER_TRANSFORMS: Record<CloudinaryResourceType, string> = {
  image: "",
  video: [
    "c_limit,w_1280,h_720,vc_h264,ac_aac,q_auto,f_mp4",
    "so_1.0,c_fill,w_640,h_640,f_jpg",
  ].join("|"),
};

/** Rendition Cloudinary produces for each eager transform above. */
export const CLOUDINARY_VIDEO_DERIVED_FORMATS = ["mp4", "jpg"] as const;

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryDerivedAsset {
  secure_url: string;
  transformation: string;
  format: string;
}

export interface CloudinaryAsset {
  asset_id: string;
  public_id: string;
  resource_type: CloudinaryResourceType;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  derived?: CloudinaryDerivedAsset[];
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Reports which Cloudinary variables are present and flags the shape problems
 * that silently break signatures (wrapped quotes, stray whitespace from a
 * copy/paste into the deployment dashboard) without ever exposing a secret.
 */
export function inspectCloudinaryEnvironment(): {
  present: Record<keyof CloudinaryConfig, boolean>;
  warnings: string[];
  maskedCloudName: string | null;
} {
  const raw: Record<keyof CloudinaryConfig, string | undefined> = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
  const warnings: string[] = [];
  const present = {} as Record<keyof CloudinaryConfig, boolean>;

  for (const [key, value] of Object.entries(raw)) {
    present[key as keyof CloudinaryConfig] = Boolean(value && value.trim());
    if (!value || !value.trim()) {
      warnings.push(`${key} is not set in this environment.`);
      continue;
    }
    if (value !== value.trim()) {
      warnings.push(`${key} has leading or trailing whitespace.`);
    }
    if (/^["']|["']$/.test(value)) {
      warnings.push(`${key} is wrapped in quotes, which Cloudinary will treat literally.`);
    }
  }

  if (raw.apiKey && raw.apiSecret && raw.apiKey.trim() === raw.apiSecret.trim()) {
    warnings.push("API key and API secret are identical - the two values were likely swapped or pasted twice.");
  }

  const cloudName = raw.cloudName?.trim();
  return {
    present,
    warnings,
    maskedCloudName: cloudName
      ? `${cloudName.slice(0, 3)}*** (${cloudName.length} chars)`
      : null,
  };
}

export function getCloudinaryUploadParams(
  resourceType: CloudinaryResourceType,
  timestamp: number,
  publicId: string
) {
  const policy = policyForResourceType(resourceType);
  return {
    allowed_formats: policy.cloudinaryFormats.join(","),
    public_id: publicId,
    timestamp,
    ...(CLOUDINARY_EAGER_TRANSFORMS[resourceType]
      ? {
          eager: CLOUDINARY_EAGER_TRANSFORMS[resourceType],
          // Videos are transcoded in the background so the upload call returns
          // immediately instead of timing out on a mobile connection.
          eager_async: "true",
        }
      : {}),
  };
}

export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const canonicalParams = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${canonicalParams}${apiSecret}`)
    .digest("hex");
}

export function normalizeCloudinaryTransform(value: string): string {
  return value
    .split(",")
    .filter((parameter) => !parameter.startsWith("f_"))
    .sort()
    .join(",");
}

/**
 * Matches the eager transformations a video has produced. Images never reach
 * this because their renditions are built on demand at delivery time.
 */
export function getCloudinaryDerivedAssets(
  asset: CloudinaryAsset
): CloudinaryDerivedAsset[] | null {
  const expected = CLOUDINARY_EAGER_TRANSFORMS.video
    .split("|")
    .map(normalizeCloudinaryTransform);
  const derived = asset.derived ?? [];
  const result = expected.map((transformation, index) =>
    derived.find((item) =>
      normalizeCloudinaryTransform(item.transformation) === transformation &&
      item.format.toLowerCase() === CLOUDINARY_VIDEO_DERIVED_FORMATS[index]
    )
  );
  return result.every((item): item is CloudinaryDerivedAsset => Boolean(item)) ? result : null;
}

export function cloudinaryAssetMimeType(kind: "photo" | "video", format: string): string {
  return mimeTypeForFormat(kind, format);
}

export async function destroyCloudinaryAsset(
  config: CloudinaryConfig,
  resourceType: CloudinaryResourceType,
  publicId: string
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: config.apiKey,
    signature: signCloudinaryParams(params, config.apiSecret),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/destroy`,
    { method: "POST", body, cache: "no-store" }
  );
  if (!response.ok) return false;

  const result: unknown = await response.json();
  return Boolean(
    result &&
      typeof result === "object" &&
      "result" in result &&
      (result.result === "ok" || result.result === "not found")
  );
}
