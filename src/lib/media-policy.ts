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
  /** Cloudinary `allowed_formats` values. */
  cloudinaryFormats: string[];
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
    cloudinaryFormats: ["jpg", "jpeg", "png", "webp"],
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
    cloudinaryFormats: ["mp4", "webm", "mov"],
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
