import { createHash } from "node:crypto";

export type CloudinaryResourceType = "image" | "video";

export const CLOUDINARY_EAGER_TRANSFORMS: Record<CloudinaryResourceType, string> = {
  image: [
    "c_fill,w_640,h_480,q_auto,f_webp",
    "c_limit,w_1600,h_1600,q_auto,f_webp",
  ].join("|"),
  video: [
    "c_limit,w_1280,h_720,vc_h264,ac_aac,q_auto,f_mp4",
    "so_1.0,c_fill,w_640,h_640,f_jpg",
  ].join("|"),
};

const CLOUDINARY_FORMATS: Record<CloudinaryResourceType, string> = {
  image: "jpg,png,webp",
  video: "mp4,webm,mov",
};

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
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function getCloudinaryUploadParams(
  resourceType: CloudinaryResourceType,
  timestamp: number,
  publicId: string
) {
  return {
    allowed_formats: CLOUDINARY_FORMATS[resourceType],
    eager: CLOUDINARY_EAGER_TRANSFORMS[resourceType],
    public_id: publicId,
    timestamp,
    ...(resourceType === "video" ? { eager_async: "true" } : {}),
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

export function getCloudinaryDerivedAssets(
  asset: CloudinaryAsset,
  resourceType: CloudinaryResourceType
): CloudinaryDerivedAsset[] | null {
  const expected = CLOUDINARY_EAGER_TRANSFORMS[resourceType]
    .split("|")
    .map(normalizeCloudinaryTransform);
  const expectedFormats = resourceType === "image" ? ["webp", "webp"] : ["mp4", "jpg"];
  const derived = asset.derived ?? [];
  const result = expected.map((transformation, index) =>
    derived.find((item) =>
      normalizeCloudinaryTransform(item.transformation) === transformation &&
      item.format.toLowerCase() === expectedFormats[index]
    )
  );
  return result.every((item): item is CloudinaryDerivedAsset => Boolean(item)) ? result : null;
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
