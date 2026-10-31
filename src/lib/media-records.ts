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
  "id,listing_id,url,kind,sort_order,thumbnail_url,processing_status,storage_provider,cloudinary_public_id,cloudinary_asset_id,card_url,detail_url,playback_url";

/** Columns every consumer of `ad_media` needs - mirrors the profile shape. */
export const AD_MEDIA_COLUMNS =
  "id,ad_id,url,kind,sort_order,thumbnail_url,processing_status,storage_provider,cloudinary_public_id,cloudinary_asset_id,card_url,detail_url,playback_url";

export interface AdMediaRow extends Omit<ProfileMediaRow, "listing_id"> {
  ad_id: string;
}

export interface ProfileMediaRow {
  id: string;
  listing_id: string;
  url: string;
  kind: "photo" | "video";
  sort_order: number;
  thumbnail_url: string | null;
  processing_status: "pending" | "processing" | "ready" | "failed";
  storage_provider?: "supabase" | "cloudinary";
  cloudinary_public_id?: string | null;
  cloudinary_asset_id?: string | null;
  card_url?: string | null;
  detail_url?: string | null;
  playback_url?: string | null;
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
  };
}

/**
 * A row counts toward the portfolio limit once it is registered, and counts
 * toward submission only once Cloudinary has finished with it.
 */
export function isMediaReady(media: PortfolioMedia): boolean {
  return (
    media.storageProvider !== "cloudinary" ||
    !media.processingStatus ||
    media.processingStatus === "ready"
  );
}

export function mergePortfolioMedia(
  current: PortfolioMedia[],
  media: PortfolioMedia
): PortfolioMedia[] {
  const existingIndex = current.findIndex((item) =>
    (media.id && item.id === media.id) ||
    (item.cloudinaryPublicId && item.cloudinaryPublicId === media.cloudinaryPublicId)
  );
  if (existingIndex < 0) return [...current, media];
  return current.map((item, index) => (index === existingIndex ? media : item));
}
