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
 */

function admin(client: SupabaseClient | null): client is SupabaseClient {
  return Boolean(client);
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
    // A photo is renderable the moment finalize stores it; only Cloudinary
    // rejections must never reach the card/detail columns.
    .neq("processing_status", "failed")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.warn("Could not read portfolio photos:", error?.message);
    return;
  }

  const rows = data as ProfileMediaRow[];
  const images = rows
    .map((row) => (row.storage_provider === "cloudinary" ? (row.detail_url ?? row.url) : row.url))
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  const coverSource = rows[0];
  const coverImage = coverSource
    ? coverSource.storage_provider === "cloudinary"
      ? coverSource.card_url ?? buildCloudinaryImageVariant(coverSource.url, "card")
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

export async function deleteIntent(client: SupabaseClient | null, publicId: string): Promise<void> {
  if (!admin(client)) return;
  const { error } = await client
    .from("media_upload_intents")
    .delete()
    .eq("cloudinary_public_id", publicId);
  if (error) console.warn("Could not delete the upload intent:", error.message);
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

  const rows = data as AdMediaRow[];
  const coverSource = rows[0];
  const coverImage = coverSource
    ? coverSource.storage_provider === "cloudinary"
      ? coverSource.card_url ?? buildCloudinaryImageVariant(coverSource.url, "card")
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
