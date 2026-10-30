import { buildCloudinaryImageVariant } from "@/lib/cloudinary-url";
import { PROFILE_MEDIA_COLUMNS } from "@/lib/media-records";
import type { ProfileMediaRow } from "@/lib/media-records";
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
