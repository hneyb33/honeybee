import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Central place for the two Supabase clients the API routes need. Both the
 * signature and finalize routes used to build a service-role client inline with
 * duplicated environment checks.
 */
export function getPublicSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getAdminSupabaseClient(): SupabaseClient | null {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) return null;
  return createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "Cache-Control": "no-store" } },
  });
}

/** Columns every consumer of `profile_media` needs, in one place. */
export const PROFILE_MEDIA_COLUMNS =
  "id,listing_id,url,kind,sort_order,thumbnail_url,processing_status,storage_provider,cloudinary_public_id,cloudinary_asset_id,card_url,detail_url,playback_url,media_key,variant_prefix,stream_uid,blurhash,moderation_status";

/** Columns every consumer of `ad_media` needs - mirrors the profile shape. */
export const AD_MEDIA_COLUMNS =
  "id,ad_id,url,kind,sort_order,thumbnail_url,processing_status,storage_provider,cloudinary_public_id,cloudinary_asset_id,card_url,detail_url,playback_url,media_key,variant_prefix,stream_uid,blurhash,moderation_status";

export interface AdMediaRow extends Omit<ProfileMediaRow, "listing_id"> {
  ad_id: string;
}

export type MediaStorageProvider = "supabase" | "cloudinary" | "r2" | "stream";
export type MediaModerationStatus = "pending" | "approved" | "rejected";

export interface ProfileMediaRow {
  id: string;
  listing_id: string;
  url: string;
  kind: "photo" | "video";
  sort_order: number;
  thumbnail_url: string | null;
  processing_status: "pending" | "processing" | "ready" | "failed";
  storage_provider?: MediaStorageProvider;
  cloudinary_public_id?: string | null;
  cloudinary_asset_id?: string | null;
  card_url?: string | null;
  detail_url?: string | null;
  playback_url?: string | null;
  /** Immutable R2 key of the stored original (`storage_provider === "r2"`). */
  media_key?: string | null;
  /** R2 prefix the processed variants live under (`{env}/{userId}/{assetId}`). */
  variant_prefix?: string | null;
  /** Cloudflare Stream video UID (`storage_provider === "stream"`). */
  stream_uid?: string | null;
  blurhash?: string | null;
  moderation_status?: MediaModerationStatus;
}

export type PortfolioMedia = {
  id?: string;
  url: string;
  kind: "photo" | "video";
  thumbnailUrl?: string | null;
  processingStatus?: ProfileMediaRow["processing_status"];
  storageProvider?: ProfileMediaRow["storage_provider"];
  cloudinaryPublicId?: string | null;
  cloudinaryAssetId?: string | null;
  cardUrl?: string | null;
  detailUrl?: string | null;
  playbackUrl?: string | null;
  mediaKey?: string | null;
  variantPrefix?: string | null;
  streamUid?: string | null;
  blurhash?: string | null;
  moderationStatus?: MediaModerationStatus;
};

export function toPortfolioMedia(
  row: ProfileMediaRow | {
    id?: string;
    url: string;
    kind: "photo" | "video";
    thumbnail_url?: string | null;
    processing_status?: string | null;
    storage_provider?: string | null;
    cloudinary_public_id?: string | null;
    cloudinary_asset_id?: string | null;
    card_url?: string | null;
    detail_url?: string | null;
    playback_url?: string | null;
    media_key?: string | null;
    variant_prefix?: string | null;
    stream_uid?: string | null;
    blurhash?: string | null;
    moderation_status?: string | null;
  }
): PortfolioMedia {
  return {
    id: row.id,
    url: row.url,
    kind: row.kind,
    thumbnailUrl: row.thumbnail_url ?? null,
    processingStatus: (row.processing_status ?? "ready") as PortfolioMedia["processingStatus"],
    storageProvider: (row.storage_provider ?? "supabase") as PortfolioMedia["storageProvider"],
    cloudinaryPublicId: row.cloudinary_public_id ?? null,
    cloudinaryAssetId: row.cloudinary_asset_id ?? null,
    cardUrl: row.card_url ?? null,
    detailUrl: row.detail_url ?? null,
    playbackUrl: row.playback_url ?? null,
    mediaKey: row.media_key ?? null,
    variantPrefix: row.variant_prefix ?? null,
    streamUid: row.stream_uid ?? null,
    blurhash: row.blurhash ?? null,
    moderationStatus: (row.moderation_status ?? "pending") as MediaModerationStatus,
  };
}

/**
 * A row counts toward the portfolio limit once it is registered, and counts
 * toward submission only once the storage provider has finished with it:
 * Cloudinary renditions for old rows, the queue worker / Stream webhook for
 * `r2` and `stream` rows.
 */
export function isMediaReady(media: PortfolioMedia): boolean {
  if (!media.processingStatus || media.processingStatus === "ready") return true;
  return media.storageProvider === "supabase";
}

export function mergePortfolioMedia(
  current: PortfolioMedia[],
  media: PortfolioMedia
): PortfolioMedia[] {
  const existingIndex = current.findIndex((item) =>
    (media.id && item.id === media.id) ||
    (item.cloudinaryPublicId && item.cloudinaryPublicId === media.cloudinaryPublicId) ||
    (item.mediaKey && item.mediaKey === media.mediaKey) ||
    (item.streamUid && item.streamUid === media.streamUid)
  );
  if (existingIndex < 0) return [...current, media];
  return current.map((item, index) => (index === existingIndex ? media : item));
}
