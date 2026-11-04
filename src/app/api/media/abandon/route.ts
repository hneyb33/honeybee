import { NextResponse } from "next/server";
import { z } from "zod";
import { destroyCloudinaryAsset, getCloudinaryConfig } from "@/lib/cloudinary";
import { getCloudflareR2Config } from "@/lib/cloudflare/config";
import { deleteOriginal, deleteMediaVariants } from "@/lib/cloudflare/r2";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { getCloudflareStreamConfig } from "@/lib/cloudflare/config";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import {
  AD_MEDIA_COLUMNS,
  PROFILE_MEDIA_COLUMNS,
  getAdminSupabaseClient,
} from "@/lib/media-records";
import {
  deleteAdMediaRow,
  deleteAdMediaRowByMediaKey,
  deleteIntent,
  deleteIntentByMediaKey,
  deleteMediaRow,
  deleteMediaRowByMediaKey,
  findMediaRowByMediaKey,
  resyncAdMedia,
  resyncListingMedia,
} from "@/lib/media-registry";
import {
  AD_UPLOADABLE_STATUSES,
  MEDIA_UPLOADABLE_STATUSES,
  parseMediaObjectKey,
  parseMediaPublicId,
  variantObjectPrefix,
  type CloudinaryResourceType,
  type MediaTarget,
} from "@/lib/media-policy";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileMediaRow } from "@/lib/media-records";

/**
 * Removes a portfolio asset the provider no longer wants: the Cloudinary file,
 * the `profile_media`/`ad_media` row and the open upload intent.
 *
 * Without this endpoint a cancelled or deleted upload leaves a paid asset in the
 * media library, a row that keeps counting toward the portfolio limit and an
 * intent that blocks the slot for two hours.
 */

const requestSchema = z
  .object({
    /** Cloudinary-era identifier (profile/ad portfolio rows). */
    publicId: z.string().min(1).max(300).optional(),
    /** R2 original key for the presigned-upload flow. */
    mediaKey: z.string().min(1).max(300).optional(),
    /** Stream video UID + owning target for Stream removals. */
    streamUid: z.string().min(4).max(128).optional(),
    listingId: z.string().uuid().optional(),
    adId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      [value.publicId, value.mediaKey, value.streamUid].filter(Boolean).length === 1,
    { message: "Exactly one of publicId, mediaKey or streamUid is required." }
  )
  .refine(
    (value) => !value.streamUid || Boolean(value.listingId) !== Boolean(value.adId),
    { message: "Stream removals must name the owning listing or ad." }
  );

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

  // ---------------------------------------------------------------------------
  // R2 originals: ownership is proven by the key scheme itself, exactly like
  // the Cloudinary public_id path below. The private original and its public
  // variants are both removed so a deleted asset never lingers on the CDN.
  // ---------------------------------------------------------------------------
  if (parsed.data.mediaKey) {
    return abandonR2Media(parsed.data.mediaKey, auth.userId, auth.client);
  }

  // ---------------------------------------------------------------------------
  // Stream videos need an explicit owning target because the video UID carries
  // no ownership structure.
  // ---------------------------------------------------------------------------
  if (parsed.data.streamUid) {
    return abandonStreamMedia(
      parsed.data.streamUid,
      auth.userId,
      auth.client,
      parsed.data.adId ? { scope: "ad", id: parsed.data.adId } : { scope: "listing", id: parsed.data.listingId as string }
    );
  }

  const publicId = parsed.data.publicId as string;
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

// ---------------------------------------------------------------------------
// Cloudflare removals
// ---------------------------------------------------------------------------

/** Verifies the target exists, belongs to the caller and accepts media edits. */
async function checkTargetEditable(
  authClient: SupabaseClient,
  userId: string,
  target: MediaTarget
): Promise<string | null> {
  if (target.scope === "ad") {
    const { data: ad } = await authClient
      .from("ads")
      .select("id,status")
      .eq("id", target.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ad) return "Ad not found or not owned by this account.";
    if (!(AD_UPLOADABLE_STATUSES as readonly string[]).includes(ad.status)) {
      return "This ad is published, so its media cannot be changed.";
    }
    return null;
  }
  const { data: listing } = await authClient
    .from("listings")
    .select("id,verification_status")
    .eq("id", target.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!listing) return "Listing not found or not owned by this account.";
  if (!(MEDIA_UPLOADABLE_STATUSES as readonly string[]).includes(listing.verification_status)) {
    return "This profile is suspended, so media cannot be changed.";
  }
  return null;
}

async function abandonR2Media(
  mediaKey: string,
  userId: string,
  authClient: SupabaseClient
): Promise<NextResponse> {
  const config = getCloudflareR2Config();
  if (!config) {
    return NextResponse.json(
      { error: "Media removal is not configured. R2 credentials are missing." },
      { status: 503 }
    );
  }
  const owner = parseMediaObjectKey(mediaKey);
  if (!owner || owner.userId !== userId || owner.env !== config.env) {
    return NextResponse.json({ error: "That media does not belong to this account." }, { status: 403 });
  }
  const target: MediaTarget = { scope: owner.scope, id: owner.id };
  const blocked = await checkTargetEditable(authClient, userId, target);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media removal is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const isAd = owner.scope === "ad";
  const row = await findMediaRowByMediaKey(
    adminClient,
    isAd ? "ad_media" : "profile_media",
    mediaKey
  );
  if (row && (row as unknown as Record<string, unknown>)[isAd ? "ad_id" : "listing_id"] !== owner.id) {
    return NextResponse.json({ error: "That media belongs to a different listing." }, { status: 403 });
  }

  // Remove the private original and the public variants even when the row is
  // already gone (an abandoned upload leaves storage residue without a row).
  const originalRemoved = await deleteOriginal(mediaKey);
  const variantsRemoved = await deleteMediaVariants(
    variantObjectPrefix(config.env, owner.userId, owner.assetId)
  );
  if (!originalRemoved) {
    return NextResponse.json(
      { error: "The storage service could not remove that file. Try again in a moment." },
      { status: 502 }
    );
  }

  if (isAd) {
    await deleteAdMediaRowByMediaKey(adminClient, mediaKey);
    await resyncAdMedia(adminClient, owner.id);
  } else {
    await deleteMediaRowByMediaKey(adminClient, mediaKey);
    await deleteIntentByMediaKey(adminClient, mediaKey);
    await resyncListingMedia(adminClient, owner.id);
  }

  return NextResponse.json({ removed: true, variantsRemoved });
}

async function abandonStreamMedia(
  streamUid: string,
  userId: string,
  authClient: SupabaseClient,
  target: MediaTarget
): Promise<NextResponse> {
  const streamConfig = getCloudflareStreamConfig();
  if (!streamConfig) {
    return NextResponse.json(
      { error: "Video removal is not configured. Stream credentials are missing." },
      { status: 503 }
    );
  }
  const blocked = await checkTargetEditable(authClient, userId, target);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media removal is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const isAd = target.scope === "ad";
  const table = isAd ? "ad_media" : "profile_media";
  const { data: row } = await adminClient
    .from(table)
    .select(isAd ? AD_MEDIA_COLUMNS : PROFILE_MEDIA_COLUMNS)
    .eq("stream_uid", streamUid)
    .maybeSingle();
  // No row means the asset is already gone - report success, but still ask
  // Stream to delete the video in case a webhook raced the row removal.
  if (row && (row as Record<string, unknown>)[isAd ? "ad_id" : "listing_id"] !== target.id) {
    return NextResponse.json({ error: "That video belongs to a different listing." }, { status: 403 });
  }

  const removed = await deleteStreamVideo(streamConfig, streamUid);
  if (!removed && row) {
    return NextResponse.json(
      { error: "Stream could not remove that video. Try again in a moment." },
      { status: 502 }
    );
  }

  if (row) {
    await adminClient.from(table).delete().eq("stream_uid", streamUid);
    await (isAd ? resyncAdMedia(adminClient, target.id) : resyncListingMedia(adminClient, target.id));
  }
  return NextResponse.json({ removed: true });
}
