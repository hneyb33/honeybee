import { NextResponse } from "next/server";
import { z } from "zod";
import { destroyCloudinaryAsset, getCloudinaryConfig } from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS } from "@/lib/media-records";
import { deleteIntent, deleteMediaRow, resyncListingMedia } from "@/lib/media-registry";
import { MEDIA_UPLOADABLE_STATUSES, type CloudinaryResourceType } from "@/lib/media-policy";
import type { ProfileMediaRow } from "@/lib/media-records";

/**
 * Removes a portfolio asset the provider no longer wants: the Cloudinary file,
 * the `profile_media` row and the open upload intent.
 *
 * Without this endpoint a cancelled or deleted upload leaves a paid asset in the
 * media library, a row that keeps counting toward the portfolio limit and an
 * intent that blocks the slot for two hours.
 */

const requestSchema = z.object({
  publicId: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "The media to remove is not specified correctly." }, { status: 400 });
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const publicId = parsed.data.publicId;
  // Uploads are keyed as honeybee/<user>/<listing>/<uuid>, which is also the
  // ownership proof checked against the session below.
  const segments = publicId.split("/");
  const listingId = segments[2];
  const resourceType = segments[1];
  if (segments.length !== 4 || segments[0] !== "honeybee" || segments[1] !== auth.userId || !listingId) {
    return NextResponse.json({ error: "That media does not belong to this account." }, { status: 403 });
  }
  if (resourceType !== "image" && resourceType !== "video") {
    return NextResponse.json({ error: "That media does not belong to this account." }, { status: 403 });
  }

  const { data: listing, error: listingError } = await auth.client
    .from("listings")
    .select("id,verification_status")
    .eq("id", listingId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (listingError || !listing) {
    return NextResponse.json(
      { error: "Could not verify that this media belongs to your profile." },
      { status: listingError ? 500 : 404 }
    );
  }
  if (!(MEDIA_UPLOADABLE_STATUSES as readonly string[]).includes(listing.verification_status)) {
    return NextResponse.json(
      { error: "This profile is suspended, so media cannot be changed." },
      { status: 409 }
    );
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media removal is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const { data: row } = await adminClient
    .from("profile_media")
    .select(PROFILE_MEDIA_COLUMNS)
    .eq("cloudinary_public_id", publicId)
    .eq("listing_id", listingId)
    .maybeSingle();
  const mediaRow = (row as ProfileMediaRow | null) ?? null;

  const cloudinary = getCloudinaryConfig();
  if (cloudinary) {
    const removed = await destroyCloudinaryAsset(
      cloudinary,
      resourceType as CloudinaryResourceType,
      publicId
    ).catch(() => false);
    if (!removed) {
      const { data: probe } = await adminClient
        .from("profile_media")
        .select("id")
        .eq("cloudinary_public_id", publicId)
        .maybeSingle();
      // Nothing stored means the upload never completed, which is fine.
      if (probe || mediaRow) {
        return NextResponse.json(
          { error: "Cloudinary could not remove that file. Try again in a moment." },
          { status: 502 }
        );
      }
    }
  }

  await deleteMediaRow(adminClient, publicId);
  await deleteIntent(adminClient, publicId);
  await resyncListingMedia(adminClient, listingId);

  return NextResponse.json({ removed: true });
}
