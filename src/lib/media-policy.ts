/**
 * Single source of truth for every media rule in Honeybee.
 *
 * The browser validator, the signed-upload route, the finalize route and the
 * admin tooling all read from here so the three layers can never drift again.
 *
 * Sizes use decimal megabytes (1 MB = 1,000,000 bytes) because that is the unit
 * Cloudinary uses for its plan and account upload limits. The previous MiB based
 * caps let the browser accept files that Cloudinary then refused.
 */

export type MediaKind = "photo" | "video";
export type CloudinaryResourceType = "image" | "video";

/** Pre-generated R2 variants. Clients may never request arbitrary widths. */
export type MediaImageVariant = "thumb" | "card" | "detail";
export const MEDIA_IMAGE_VARIANT_SIZES: Record<MediaImageVariant, number> = {
  thumb: 200,
  card: 640,
  detail: 1280,
};
export const MEDIA_IMAGE_VARIANTS = Object.keys(MEDIA_IMAGE_VARIANT_SIZES) as MediaImageVariant[];

/**
 * The signed-upload pipeline serves two targets: a provider `listing` (the
 * organic profile portfolio) and an `ad` (a paid placement). Everything that
 * used to assume a listing now branches on this scope so the same Cloudinary
 * machinery can be reused instead of forked.
 */
export type MediaScope = "listing" | "ad";

/** Identifies what an upload is being attached to. */
export interface MediaTarget {
  scope: MediaScope;
  /** Listing id when `scope === "listing"`, ad id when `scope === "ad"`. */
  id: string;
}

export function listingTarget(listingId: string): MediaTarget {
  return { scope: "listing", id: listingId };
}

export function adTarget(adId: string): MediaTarget {
  return { scope: "ad", id: adId };
}

const MB = 1000 * 1000;

export interface MediaPolicyEntry {
  kind: MediaKind;
  resourceType: CloudinaryResourceType;
  /** Row count per listing. */
  maxCount: number;
  /** Absolute ceiling accepted by our storage provider for one asset. */
  maxBytes: number;
  /**
   * Ceiling the app advertises and enforces before uploading. Kept below
   * `maxBytes` so a file the browser accepts is never refused by Cloudinary.
   */
  uploadBudgetBytes: number;
  /** Longest accepted video. Photos ignore this. */
  maxDurationSeconds?: number;
  /** MIME types the file picker accepts. */
  allowedMimeTypes: string[];
  /** Formats accepted by the storage provider (Cloudinary `allowed_formats` values). */
  allowedFormats: string[];
  label: string;
  unitLabel: string;
}

export const MEDIA_POLICY: Record<MediaKind, MediaPolicyEntry> = {
  photo: {
    kind: "photo",
    resourceType: "image",
    maxCount: 9,
    maxBytes: 10 * MB,
    uploadBudgetBytes: 10 * MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    // Cloudinary reports a JPEG upload as `jpg`; `jpeg` is listed as well so a
    // browser that names the file `.jpeg` is never rejected on format grounds.
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    label: "photo",
    unitLabel: "photos",
  },
  video: {
    kind: "video",
    resourceType: "video",
    maxCount: 3,
    // 100 MB is Cloudinary's ceiling for a single (non-chunked) upload request.
    maxBytes: 100 * MB,
    uploadBudgetBytes: 90 * MB,
    maxDurationSeconds: 120,
    allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    allowedFormats: ["mp4", "webm", "mov"],
    label: "video",
    unitLabel: "videos",
  },
};

export const MEDIA_KINDS: MediaKind[] = ["photo", "video"];

/**
 * Files above this size are uploaded in chunks. Chunking is mandatory above
 * 100 MB and is used earlier here because a chunked upload survives an
 * interrupted mobile uplink: only the chunk is lost, not the whole asset.
 */
export const CHUNKED_UPLOAD_MIN_BYTES = 20 * MB;

/** Cloudinary requires every chunk except the last to be larger than 5 MB. */
export const UPLOAD_CHUNK_BYTES = 10 * MB;

/** Listing states that accept new portfolio media. */
export const MEDIA_UPLOADABLE_STATUSES = [
  "draft",
  "pending",
  "under_review",
  "rejected",
  "verified",
] as const;

/**
 * Ad states that accept portfolio media. A provider can never edit a published
 * ad, so `published`/`expired` are intentionally excluded here (admins reach ad
 * media through the service-role RPCs instead).
 */
export const AD_UPLOADABLE_STATUSES = ["draft", "pending", "rejected"] as const;

/**
 * The Cloudinary folder that scopes an upload to its owner + target. Ads add an
 * `ad/` marker segment so a public_id is never ambiguous between the two tables.
 */
export function mediaUploadPrefix(userId: string, target: MediaTarget): string {
  return target.scope === "ad"
    ? `honeybee/${userId}/ad/${target.id}/`
    : `honeybee/${userId}/${target.id}/`;
}

/**
 * Recovers the owner + target from a public_id. Returns `null` when the id does
 * not match the Honeybee scheme. Listing ids are 4 segments; ad ids carry the
 * literal `ad` marker and are therefore 5 segments.
 */
export function parseMediaPublicId(
  publicId: string
): (MediaTarget & { userId: string }) | null {
  const segments = publicId.split("/");
  if (segments[0] !== "honeybee" || !segments[1]) return null;
  if (segments.length === 5 && segments[2] === "ad") {
    return { scope: "ad", id: segments[3], userId: segments[1] };
  }
  if (segments.length === 4) {
    return { scope: "listing", id: segments[2], userId: segments[1] };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cloudflare R2 key scheme
//
// Originals live in the private bucket under
//   {env}/{userId}/{scope}/{targetId}/{assetId}/original.{ext}
// (`scope` is `listing` or the literal `ad`, mirroring the public_id markers).
// Processed variants are written to the public bucket under the shorter, still
// immutable
//   {env}/{userId}/{assetId}/{variant}.webp
// Keys are never overwritten, so every delivery URL can be cached forever.
// ---------------------------------------------------------------------------

export interface MediaObjectKey extends MediaTarget {
  userId: string;
  env: string;
  assetId: string;
  filename: string;
}

export function mediaObjectPrefix(env: string, userId: string, target: MediaTarget): string {
  return target.scope === "ad"
    ? `${env}/${userId}/ad/${target.id}`
    : `${env}/${userId}/listing/${target.id}`;
}

export function mediaObjectKey(
  env: string,
  userId: string,
  target: MediaTarget,
  assetId: string,
  extension: string
): string {
  return `${mediaObjectPrefix(env, userId, target)}/${assetId}/original.${extension}`;
}

/** Recovers env/owner/target from an R2 object key, or `null` if malformed. */
export function parseMediaObjectKey(key: string): MediaObjectKey | null {
  const segments = key.split("/");
  if (segments.length !== 6) return null;
  const [env, userId, scopeMarker, targetId, assetId, filename] = segments;
  if (!env || !userId || !assetId || !filename) return null;
  if (scopeMarker === "listing") {
    return { env, userId, scope: "listing", id: targetId, assetId, filename };
  }
  if (scopeMarker === "ad") {
    return { env, userId, scope: "ad", id: targetId, assetId, filename };
  }
  return null;
}

/** Prefix of the processed variants for one asset in the public bucket. */
export function variantObjectPrefix(env: string, userId: string, assetId: string): string {
  return `${env}/${userId}/${assetId}`;
}

/** Delivery URL for one pre-generated variant on the custom media domain. */
export function variantDeliveryUrl(domain: string, prefix: string, variant: MediaImageVariant): string {
  return `https://${domain}/${prefix}/${variant}.webp`;
}

export function policyForKind(kind: MediaKind): MediaPolicyEntry {
  return MEDIA_POLICY[kind];
}

export function policyForResourceType(resourceType: CloudinaryResourceType): MediaPolicyEntry {
  return MEDIA_POLICY[resourceType === "image" ? "photo" : "video"];
}

export function kindForResourceType(resourceType: CloudinaryResourceType): MediaKind {
  return resourceType === "image" ? "photo" : "video";
}

export function resourceTypeForKind(kind: MediaKind): CloudinaryResourceType {
  return MEDIA_POLICY[kind].resourceType;
}

export function mimeTypeForFormat(kind: MediaKind, format: string): string {
  const normalised = format.toLowerCase();
  if (kind === "photo") {
    return normalised === "jpg" || normalised === "jpeg" ? "image/jpeg" : `image/${normalised}`;
  }
  if (normalised === "mov" || normalised === "quicktime") return "video/quicktime";
  return `video/${normalised}`;
}

/** File extension used inside an R2 key for a MIME type. */
export function extensionForMimeType(kind: MediaKind, mimeType: string): string {
  const subtype = (mimeType.split("/")[1] ?? "").split(";")[0].trim();
  if (kind === "photo") {
    if (subtype === "jpeg" || subtype === "jpg") return "jpg";
    return subtype || "jpg";
  }
  if (subtype === "quicktime") return "mov";
  return subtype || "mp4";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / (1000 * 1000)).toFixed(0)} MB`;
}

/**
 * Pre-flight validation shared by every picker. Returns a human-readable reason
 * when the file must not be uploaded, or `null` when it is acceptable.
 */
export function describeMediaRejection(
  file: File,
  counts: Record<MediaKind, number>,
  options?: { videoDurationSeconds?: number }
): string | null {
  const kind = MEDIA_KINDS.find((candidate) =>
    MEDIA_POLICY[candidate].allowedMimeTypes.includes(file.type)
  );
  if (!kind) {
    return "Choose JPEG, PNG, or WebP photos and MP4, WebM, or QuickTime videos.";
  }
  const policy = MEDIA_POLICY[kind];
  if (file.size === 0) return "Empty files cannot be uploaded.";
  if (file.size > policy.uploadBudgetBytes) {
    return `Each ${policy.label} must be ${formatBytes(policy.uploadBudgetBytes)} or smaller. Yours is ${formatBytes(file.size)}.`;
  }
  if (counts[kind] >= policy.maxCount) {
    return `A profile can have up to ${policy.maxCount} ${policy.unitLabel}.`;
  }
  if (options?.videoDurationSeconds !== undefined && policy.maxDurationSeconds) {
    if (options.videoDurationSeconds > policy.maxDurationSeconds) {
      return `Each ${policy.label} must be ${policy.maxDurationSeconds / 60} minutes or shorter.`;
    }
  }
  return null;
}

/** `accept` attribute for the file input, derived from the policy. */
export const MEDIA_ACCEPT_ATTRIBUTE = MEDIA_KINDS
  .flatMap((kind) => MEDIA_POLICY[kind].allowedMimeTypes)
  .join(",");
