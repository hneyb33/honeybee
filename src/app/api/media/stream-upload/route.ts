import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareStreamConfig, inspectCloudflareEnvironment } from "@/lib/cloudflare/config";
import { createDirectUpload, streamThumbnailUrl } from "@/lib/cloudflare/stream";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS, AD_MEDIA_COLUMNS } from "@/lib/media-records";
import { streamIntentKey } from "@/lib/media-registry";
import {
  AD_UPLOADABLE_STATUSES,
  MEDIA_UPLOADABLE_STATUSES,
  policyForResourceType,
  type MediaTarget,
} from "@/lib/media-policy";

/**
 * Cloudflare Stream direct-upload initiation - the video twin of
 * `/api/media/signature`. The same ownership, uploadable-state, count and
 * intent guards run here; afterwards the browser pushes bytes resumingly
 * (tus) straight to Stream and the webhook flips the row to `ready`.
 */

const requestSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    adId: z.string().uuid().optional(),
    contentType: z.string().min(4).max(80).optional(),
    filename: z.string().min(1).max(255).optional(),
  })
  .refine((value) => Boolean(value.listingId) !== Boolean(value.adId), {
    message: "Exactly one of listingId or adId is required.",
  });

/** Abandoned authorizations stop counting toward the limit after this window. */
const OPEN_INTENT_TTL_MS = 2 * 60 * 60 * 1000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid listing or ad and a video are required." },
      { status: 400 }
    );
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const target: MediaTarget = parsed.data.adId
    ? { scope: "ad", id: parsed.data.adId }
    : { scope: "listing", id: parsed.data.listingId as string };
  const policy = policyForResourceType("video");

  // ---------------------------------------------------------------------------
  // Ownership + uploadable-state checks (identical outcomes to /signature).
  // ---------------------------------------------------------------------------
  if (target.scope === "ad") {
    const { data: ad, error: adError } = await auth.client
      .from("ads")
      .select("id,status")
      .eq("id", target.id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (adError) {
      return NextResponse.json({ error: "Could not verify ad ownership." }, { status: 500 });
    }
    if (!ad) {
      return NextResponse.json(
        { error: "Ad not found or not owned by this account." },
        { status: 404 }
      );
    }
    if (!(AD_UPLOADABLE_STATUSES as readonly string[]).includes(ad.status)) {
      return NextResponse.json(
        { error: "This ad is published, so its media cannot be changed." },
        { status: 409 }
      );
    }
  } else {
    const { data: listing, error: listingError } = await auth.client
      .from("listings")
      .select("id,verification_status")
      .eq("id", target.id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (listingError) {
      return NextResponse.json({ error: "Could not verify listing ownership." }, { status: 500 });
    }
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found or not owned by this account." },
        { status: 404 }
      );
    }
    if (!(MEDIA_UPLOADABLE_STATUSES as readonly string[]).includes(listing.verification_status)) {
      return NextResponse.json(
        {
          error:
            "This profile is suspended, so media cannot be changed. Contact support to restore it.",
        },
        { status: 409 }
      );
    }
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media uploads are not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const streamConfig = getCloudflareStreamConfig();
  if (!streamConfig) {
    const environment = inspectCloudflareEnvironment();
    const missing = (Object.keys(environment.present) as Array<keyof typeof environment.present>)
      .filter((key) => !environment.present[key]);
    return NextResponse.json(
      {
        error: missing.length
          ? `Video uploads are not configured on this deployment. Missing: ${missing.join(", ")}.`
          : "Video uploads are not configured on this deployment.",
        warnings: environment.warnings,
      },
      { status: 503 }
    );
  }

  // ---------------------------------------------------------------------------
  // Capacity: registered video rows + open intents inside the TTL window.
  // ---------------------------------------------------------------------------
  const mediaTable = target.scope === "ad" ? "ad_media" : "profile_media";
  const ownerKey = target.scope === "ad" ? "ad_id" : "listing_id";
  const { count: registered } = await adminClient
    .from(mediaTable)
    .select("id", { count: "exact", head: true })
    .eq(ownerKey, target.id)
    .eq("kind", policy.kind);

  let pendingCount = 0;
  if (target.scope === "listing") {
    const { data: openIntents, error: intentError } = await adminClient
      .from("media_upload_intents")
      .select("media_key")
      .eq("listing_id", target.id)
      .eq("resource_type", "video")
      .not("media_key", "is", null)
      .is("completed_at", null)
      .gt("requested_at", new Date(Date.now() - OPEN_INTENT_TTL_MS).toISOString());
    if (intentError) {
      console.warn("media_upload_intents unavailable:", intentError.message);
    }
    pendingCount = (openIntents ?? []).length;
  }

  if ((registered ?? 0) + pendingCount >= policy.maxCount) {
    return NextResponse.json(
      {
        error: `A profile can have up to ${policy.maxCount} ${policy.unitLabel}. Remove one and try again if nothing is pending.`,
      },
      { status: 409 }
    );
  }

  // Ask Stream for a resumable upload target before touching any table so a
  // Stream outage never leaves a half-registered row behind.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  let upload: { videoUid: string; uploadURL: string };
  try {
    upload = await createDirectUpload(streamConfig, {
      maxDurationSeconds: policy.maxDurationSeconds ?? 120,
      maxUploadSeconds: Math.floor(OPEN_INTENT_TTL_MS / 1000),
      notifyURL: `${origin}/api/stream/webhook`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not authorize the upload with the video service. Try again in a moment.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 502 }
    );
  }

  if (target.scope === "listing") {
    const { error: insertIntentError } = await adminClient
      .from("media_upload_intents")
      .upsert(
        {
          listing_id: target.id,
          user_id: auth.userId,
          media_key: streamIntentKey(upload.videoUid),
          resource_type: "video",
          requested_at: new Date().toISOString(),
          completed_at: null,
        },
        { onConflict: "media_key" }
      );
    if (insertIntentError) {
      console.warn("Could not record the Stream upload intent:", insertIntentError.message);
    }
  }

  // The row exists from the first byte: `processing` rows are hidden from
  // delivery (see media-registry) and the webhook or an abandon removes or
  // flips it, so an interrupted upload can never leak a broken video.
  const { count: sortOrder } = await adminClient
    .from(mediaTable)
    .select("id", { count: "exact", head: true })
    .eq(ownerKey, target.id)
    .eq("kind", policy.kind);
  const declaredType = parsed.data.contentType ?? "video/mp4";
  const { data: savedMedia, error: saveError } = await adminClient
    .from(mediaTable)
    .upsert(
      {
        [ownerKey]: target.id,
        kind: policy.kind,
        sort_order: sortOrder ?? 0,
        url: streamThumbnailUrl(upload.videoUid),
        thumbnail_url: streamThumbnailUrl(upload.videoUid),
        playback_url: null,
        storage_provider: "stream",
        stream_uid: upload.videoUid,
        mime_type: declaredType,
        original_filename: (parsed.data.filename ?? "video").replace(/^.*[\\/]/, "").slice(0, 255),
        processing_status: "processing",
        moderation_status: "pending",
      },
      { onConflict: "stream_uid" }
    )
    .select(target.scope === "ad" ? AD_MEDIA_COLUMNS : PROFILE_MEDIA_COLUMNS)
    .single();
  if (saveError || !savedMedia) {
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the video upload." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    provider: "stream",
    videoUid: upload.videoUid,
    uploadURL: upload.uploadURL,
    media: savedMedia,
  });
}
