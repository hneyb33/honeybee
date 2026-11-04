import { buildCloudinaryImageVariant } from "@/lib/cloudinary-url";
import { AD_MEDIA_COLUMNS, PROFILE_MEDIA_COLUMNS } from "@/lib/media-records";
import type { AdMediaRow, ProfileMediaRow } from "@/lib/media-records";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side bookkeeping for `profile_media`.
 *
 * The finalize route and the abandon route both need to keep `listings.images`
 * and `listings.cover_image` in step with the media rows, so the logic lives
 * here instead of being pasted into a second route handler.
 *
 * R2 rows join the rebuilt columns only once the queue worker has flipped them
 * to `ready`; until then their variant URLs would 404 on the media domain.
 */

function admin(client: SupabaseClient | null): client is SupabaseClient {
  return Boolean(client);
}

/** A row whose delivery URLs are already valid. */
function isRenderableRow(row: { storage_provider?: string | null; processing_status?: string | null }): boolean {
  if (row.processing_status === "failed") return false;
  if (row.storage_provider === "r2" || row.storage_provider === "stream") {
    return row.processing_status === "ready";
  }
  return true;
}

/**
 * Rewrites `listings.images` (detail renditions, in sort order) and
 * `listings.cover_image` (small card rendition) from the registered rows.
 *
 * A failure here is never fatal: the media itself is stored, and the next
 * profile save or upload repairs the columns.
 */
export async function resyncListingMedia(
  client: SupabaseClient | null,
  listingId: string
): Promise<void> {
  if (!admin(client)) return;

  const { data, error } = await client
    .from("profile_media")
    .select(PROFILE_MEDIA_COLUMNS)
    .eq("listing_id", listingId)
    .eq("kind", "photo")
    // A photo is renderable the moment finalize stores it (Cloudinary renditions
    // are on demand) or once the queue worker has finished an R2 original;
    // failures must never reach the card/detail columns.
    .neq("processing_status", "failed")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.warn("Could not read portfolio photos:", error?.message);
    return;
  }

  const rows = (data as ProfileMediaRow[]).filter(isRenderableRow);
  const images = rows
    .map((row) =>
      row.storage_provider === "cloudinary" || row.storage_provider === "r2"
        ? (row.detail_url ?? row.url)
        : row.url
    )
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  const coverSource = rows[0];
  const coverImage = coverSource
    ? coverSource.storage_provider === "cloudinary"
      ? coverSource.card_url ?? buildCloudinaryImageVariant(coverSource.url, "card")
      : coverSource.storage_provider === "r2"
        ? coverSource.card_url ?? coverSource.detail_url ?? coverSource.url
        : coverSource.url
    : null;

  const { error: updateError } = await client
    .from("listings")
    .update({
      images,
      // Keep the cover pointing at the small rendition so cards stay light.
      cover_image: coverImage,
    })
    .eq("id", listingId);
  if (updateError) {
    console.warn("Could not sync listing images:", updateError.message);
  }
}

/** Closes the upload intent so the slot becomes reusable. */
export async function markIntentComplete(
  client: SupabaseClient | null,
  publicId: string
): Promise<void> {
  if (!admin(client)) return;
  const { error } = await client
    .from("media_upload_intents")
    .update({ completed_at: new Date().toISOString() })
    .eq("cloudinary_public_id", publicId);
  if (error) {
    console.warn("Could not close the upload intent:", error.message);
  }
}

/**
 * Stream uploads have no R2 key, but the intents table needs a non-null
 * identifier to expire abandoned slots the same way; `stream:{uid}` keeps
 * that column's "one row per in-flight asset" contract.
 */
export function streamIntentKey(videoUid: string): string {
  return `stream:${videoUid}`;
}

/** R2-keyed twin of `markIntentComplete` for the presigned-upload flow. */
export async function markIntentCompleteByMediaKey(
  client: SupabaseClient | null,
  mediaKey: string
): Promise<void> {
  if (!admin(client)) return;
  const { error } = await client
    .from("media_upload_intents")
    .update({ completed_at: new Date().toISOString() })
    .eq("media_key", mediaKey);
  if (error) {
    console.warn("Could not close the R2 upload intent:", error.message);
  }
}

export async function deleteIntent(client: SupabaseClient | null, publicId: string): Promise<void> {
  if (!admin(client)) return;
  const { error } = await client
    .from("media_upload_intents")
    .delete()
    .eq("cloudinary_public_id", publicId);
  if (error) console.warn("Could not delete the upload intent:", error.message);
}

export async function deleteIntentByMediaKey(
  client: SupabaseClient | null,
  mediaKey: string
): Promise<void> {
  if (!admin(client)) return;
  const { error } = await client
    .from("media_upload_intents")
    .delete()
    .eq("media_key", mediaKey);
  if (error) console.warn("Could not delete the R2 upload intent:", error.message);
}

/** Removes the database row for an abandoned or deleted asset. */
export async function deleteMediaRow(
  client: SupabaseClient | null,
  publicId: string
): Promise<ProfileMediaRow | null> {
  if (!admin(client)) return null;
  const { data, error } = await client
    .from("profile_media")
    .delete()
    .eq("cloudinary_public_id", publicId)
    .select(PROFILE_MEDIA_COLUMNS)
    .maybeSingle();
  if (error) {
    console.warn("Could not delete the media row:", error.message);
    return null;
  }
  return (data as ProfileMediaRow | null) ?? null;
}

/** R2-keyed twin of `deleteMediaRow`. */
export async function deleteMediaRowByMediaKey(
  client: SupabaseClient | null,
  mediaKey: string
): Promise<ProfileMediaRow | null> {
  if (!admin(client)) return null;
  const { data, error } = await client
    .from("profile_media")
    .delete()
    .eq("media_key", mediaKey)
    .select(PROFILE_MEDIA_COLUMNS)
    .maybeSingle();
  if (error) {
    console.warn("Could not delete the R2 media row:", error.message);
    return null;
  }
  return (data as ProfileMediaRow | null) ?? null;
}

/**
 * Rewrites `ads.cover_image` from the registered `ad_media` rows, exactly the
 * way `resyncListingMedia` keeps a profile's cover pointing at the small card
 * rendition. Ads store their gallery in `ad_media` (no inline images column),
 * so only the cover needs rebuilding here.
 *
 * A failure is never fatal: the media row is already stored and the next upload
 * or save repairs the cover.
 */
export async function resyncAdMedia(
  client: SupabaseClient | null,
  adId: string
): Promise<void> {
  if (!admin(client)) return;

  const { data, error } = await client
    .from("ad_media")
    .select(AD_MEDIA_COLUMNS)
    .eq("ad_id", adId)
    .eq("kind", "photo")
    .neq("processing_status", "failed")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.warn("Could not read ad photos:", error?.message);
    return;
  }

  const rows = (data as AdMediaRow[]).filter(isRenderableRow);
  const coverSource = rows[0];
  const coverImage = coverSource
    ? coverSource.storage_provider === "cloudinary"
      ? coverSource.card_url ?? buildCloudinaryImageVariant(coverSource.url, "card")
      : coverSource.storage_provider === "r2"
        ? coverSource.card_url ?? coverSource.detail_url ?? coverSource.url
        : coverSource.url
    : null;

  const { error: updateError } = await client
    .from("ads")
    .update({ cover_image: coverImage })
    .eq("id", adId);
  if (updateError) {
    console.warn("Could not sync ad cover image:", updateError.message);
  }
}

/** Removes the `ad_media` row for an abandoned or deleted ad asset. */
export async function deleteAdMediaRow(
  client: SupabaseClient | null,
  publicId: string
): Promise<AdMediaRow | null> {
  if (!admin(client)) return null;
  const { data, error } = await client
    .from("ad_media")
    .delete()
    .eq("cloudinary_public_id", publicId)
    .select(AD_MEDIA_COLUMNS)
    .maybeSingle();
  if (error) {
    console.warn("Could not delete the ad media row:", error.message);
    return null;
  }
  return (data as AdMediaRow | null) ?? null;
}

/** R2-keyed twin of `deleteAdMediaRow`. */
export async function deleteAdMediaRowByMediaKey(
  client: SupabaseClient | null,
  mediaKey: string
): Promise<AdMediaRow | null> {
  if (!admin(client)) return null;
  const { data, error } = await client
    .from("ad_media")
    .delete()
    .eq("media_key", mediaKey)
    .select(AD_MEDIA_COLUMNS)
    .maybeSingle();
  if (error) {
    console.warn("Could not delete the ad media row:", error.message);
    return null;
  }
  return (data as AdMediaRow | null) ?? null;
}

/** Finds a registered row by its immutable R2 key (either owner table). */
export async function findMediaRowByMediaKey(
  client: SupabaseClient | null,
  table: "profile_media" | "ad_media",
  mediaKey: string
): Promise<ProfileMediaRow | AdMediaRow | null> {
  if (!admin(client)) return null;
  const { data, error } = await client
    .from(table)
    .select(table === "ad_media" ? AD_MEDIA_COLUMNS : PROFILE_MEDIA_COLUMNS)
    .eq("media_key", mediaKey)
    .maybeSingle();
  if (error) {
    console.warn("Could not read the media row:", error.message);
    return null;
  }
  return (data as ProfileMediaRow | AdMediaRow | null) ?? null;
}
