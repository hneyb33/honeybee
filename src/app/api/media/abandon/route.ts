import { NextResponse } from "next/server";
import { z } from "zod";
import { destroyCloudinaryAsset, getCloudinaryConfig } from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import {
  AD_MEDIA_COLUMNS,
  PROFILE_MEDIA_COLUMNS,
  getAdminSupabaseClient,
} from "@/lib/media-records";
import {
  deleteAdMediaRow,
  deleteIntent,
  deleteMediaRow,
  resyncAdMedia,
  resyncListingMedia,
} from "@/lib/media-registry";
import {
  AD_UPLOADABLE_STATUSES,
  MEDIA_UPLOADABLE_STATUSES,
  parseMediaPublicId,
  type CloudinaryResourceType,
} from "@/lib/media-policy";
import type { ProfileMediaRow } from "@/lib/media-records";

/**
 * Removes a portfolio asset the provider no longer wants: the Cloudinary file,
 * the `profile_media`/`ad_media` row and the open upload intent.
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
  // Uploads are keyed as honeybee/<user>/<listing>/<uuid> (profiles) or
  // honeybee/<user>/ad/<adId>/<uuid> (ads); that structure is also the ownership
  // proof checked against the session below.
  const target = parseMediaPublicId(publicId);
  if (!target || target.userId !== auth.userId) {
    return NextResponse.json({ error: "That media does not belong to this account." }, { status: 403 });
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media removal is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const isAd = target.scope === "ad";
  const mediaTable = isAd ? "ad_media" : "profile_media";
  const mediaColumns = isAd ? AD_MEDIA_COLUMNS : PROFILE_MEDIA_COLUMNS;
  const ownerKey = isAd ? "ad_id" : "listing_id";

  // Verify ownership + uploadable state, and learn the asset's kind so we can
  // destroy the right Cloudinary resource type.
  let resourceType: CloudinaryResourceType | null = null;
  let mediaRow: ProfileMediaRow | null = null;
  if (isAd) {
    const { data: ad, error: adError } = await auth.client
      .from("ads")
      .select("id,status")
      .eq("id", target.id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (adError || !ad) {
      return NextResponse.json(
        { error: "Could not verify that this media belongs to your ad." },
        { status: adError ? 500 : 404 }
      );
    }
    if (!(AD_UPLOADABLE_STATUSES as readonly string[]).includes(ad.status)) {
      return NextResponse.json(
        { error: "This ad is published, so its media cannot be changed." },
        { status: 409 }
      );
    }
    const { data: row } = await adminClient
      .from(mediaTable)
      .select(mediaColumns)
      .eq("cloudinary_public_id", publicId)
      .eq(ownerKey, target.id)
      .maybeSingle();
    mediaRow = (row as ProfileMediaRow | null) ?? null;
  } else {
    const { data: listing, error: listingError } = await auth.client
      .from("listings")
      .select("id,verification_status")
      .eq("id", target.id)
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
    const { data: row } = await adminClient
      .from(mediaTable)
      .select(mediaColumns)
      .eq("cloudinary_public_id", publicId)
      .eq(ownerKey, target.id)
      .maybeSingle();
    mediaRow = (row as ProfileMediaRow | null) ?? null;
  }

  // The stored row knows whether this was a photo or a video, so the destroy
  // call targets the correct Cloudinary resource type instead of guessing from
  // the public_id segments.
  if (mediaRow) {
    resourceType = mediaRow.kind === "video" ? "video" : "image";
  } else {
    const { data: probe } = await adminClient
      .from(mediaTable)
      .select("kind")
      .eq("cloudinary_public_id", publicId)
      .maybeSingle();
    resourceType = probe && (probe as { kind?: string }).kind === "video" ? "video" : "image";
  }

  const cloudinary = getCloudinaryConfig();
  if (cloudinary) {
    const removed = await destroyCloudinaryAsset(cloudinary, resourceType, publicId).catch(() => false);
    if (!removed && mediaRow) {
      return NextResponse.json(
        { error: "Cloudinary could not remove that file. Try again in a moment." },
        { status: 502 }
      );
    }
  }

  if (isAd) {
    await deleteAdMediaRow(adminClient, publicId);
    await resyncAdMedia(adminClient, target.id);
  } else {
    await deleteMediaRow(adminClient, publicId);
    await deleteIntent(adminClient, publicId);
    await resyncListingMedia(adminClient, target.id);
  }

  return NextResponse.json({ removed: true });
}
