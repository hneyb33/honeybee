import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS } from "@/lib/media-records";
import { getCloudflareR2Config, getCloudflareStreamConfig } from "@/lib/cloudflare/config";
import {
  deleteOriginal,
  presignOriginalUpload,
  publishProcessingEvent,
} from "@/lib/cloudflare/r2";
import { createDirectUpload, streamThumbnailUrl } from "@/lib/cloudflare/stream";
import {
  MEDIA_KINDS,
  MEDIA_POLICY,
  MEDIA_UPLOADABLE_STATUSES,
  extensionForMimeType,
  mediaObjectKey,
  mimeTypeForFormat,
  variantDeliveryUrl,
  variantObjectPrefix,
  type MediaKind,
} from "@/lib/media-policy";
import { isAllowedDetectedFormat, sniffImageFormat } from "@/lib/media-magic";
import { resyncListingMedia } from "@/lib/media-registry";

/**
 * Admin relay for portfolio media on any listing.
 *
 * The provider upload routes (`/api/media/signature`, `/api/media/stream-upload`)
 * are ownership-locked: they only ever let a provider attach media to their own
 * listing. An admin adding photos or videos from the listing dialog is acting
 * for someone else, so this route takes the file directly (multipart), runs the
 * same policy checks, and registers the asset with the *listing owner* as the
 * key/prefix subject - the identical shape the browser pipeline produces, so
 * the `hb-media-process` worker and the Stream webhook pick the row up without
 * knowing an admin uploaded it.
 *
 * Photos: presigned PUT into the R2 originals bucket, magic-byte validation,
 * a `processing` profile_media row, then the queue event (in production the R2
 * notification fires on its own; the direct send covers local simulation).
 * Videos: one-shot PUT against a Cloudflare Stream direct-upload target; the
 * encoding webhook flips the row.
 */

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "A valid listing id is required." }, { status: 400 });
  }
  const id = parsedParams.data.id;

  // --- Admin identity (same gate as POST /api/admin/listings) ----------------
  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { data: actor, error: actorError } = await auth.client
    .from("profiles")
    .select("role")
    .eq("id", auth.userId)
    .maybeSingle();
  if (actorError) return NextResponse.json({ error: actorError.message }, { status: 500 });
  if (!actor || !["super_admin", "moderator"].includes(actor.role)) {
    return NextResponse.json({ error: "Admin access is required to upload listing media." }, { status: 403 });
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media uploads are not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  // --- File -------------------------------------------------------------------
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Attach the media file in a multipart 'file' field." }, { status: 400 });
  }
  const filename = (file instanceof File ? file.name : "upload").replace(/^.*[\\/]/, "").slice(0, 255);
  const kind: MediaKind | undefined = MEDIA_KINDS.find((candidate) =>
    MEDIA_POLICY[candidate].allowedMimeTypes.includes(file.type)
  );
  if (!kind) {
    return NextResponse.json(
      { error: "Choose JPEG, PNG or WebP photos and MP4, WebM or QuickTime videos." },
      { status: 422 }
    );
  }
  const policy = MEDIA_POLICY[kind];
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty files cannot be uploaded." }, { status: 422 });
  }
  if (file.size > policy.uploadBudgetBytes) {
    return NextResponse.json(
      {
        error: `Each ${policy.label} must be ${Math.round(policy.uploadBudgetBytes / 1_000_000)} MB or smaller. Yours is ${Math.round(file.size / 1_000_000)} MB.`,
      },
      { status: 413 }
    );
  }

  // --- Listing state ------------------------------------------------------------
  const { data: listing, error: listingError } = await adminClient
    .from("listings")
    .select("id,user_id,verification_status")
    .eq("id", id)
    .maybeSingle();
  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (!(MEDIA_UPLOADABLE_STATUSES as readonly string[]).includes(listing.verification_status)) {
    return NextResponse.json(
      { error: "This profile is suspended, so its media cannot be changed." },
      { status: 409 }
    );
  }

  const { count: registered } = await adminClient
    .from("profile_media")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listing.id)
    .eq("kind", kind);
  if ((registered ?? 0) >= policy.maxCount) {
    return NextResponse.json(
      { error: `A profile can have up to ${policy.maxCount} ${policy.unitLabel}. Remove one and try again.` },
      { status: 409 }
    );
  }
  const sortOrder = registered ?? 0;

  return kind === "photo"
    ? registerPhoto(adminClient, listing, file, filename, sortOrder)
    : registerVideo(request, adminClient, listing, file, filename, sortOrder);
}

type ListingRef = { id: string; user_id: string };

/** R2 originals -> hb-media-process queue, mirroring the finalize route. */
async function registerPhoto(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  listing: ListingRef,
  file: Blob,
  filename: string,
  sortOrder: number
): Promise<NextResponse> {
  const config = getCloudflareR2Config();
  if (!config) {
    return NextResponse.json(
      { error: "Media storage is not configured. CF_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required." },
      { status: 503 }
    );
  }
  const policy = MEDIA_POLICY.photo;

  const prefixBytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (!isAllowedDetectedFormat("photo", policy.allowedFormats, prefixBytes)) {
    return NextResponse.json(
      { error: "That file format is not supported. Use JPEG, PNG or WebP photos." },
      { status: 422 }
    );
  }
  const detected = sniffImageFormat(prefixBytes) ?? "jpg";
  const mimeType = mimeTypeForFormat("photo", detected);

  const assetId = crypto.randomUUID();
  const target = { scope: "listing" as const, id: listing.id };
  const mediaKey = mediaObjectKey(config.env, listing.user_id, target, assetId, extensionForMimeType("photo", mimeType));

  let putOk = false;
  let putStatus = 0;
  try {
    const presigned = await presignOriginalUpload(mediaKey, mimeType);
    const put = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": presigned.contentType },
      body: file,
      cache: "no-store",
    });
    putOk = put.ok;
    putStatus = put.status;
  } catch (error) {
    putOk = false;
    console.warn("admin media relay: presigned PUT failed:", error);
  }
  if (!putOk) {
    await deleteOriginal(mediaKey);
    return NextResponse.json(
      { error: `The storage service refused the upload${putStatus ? ` (HTTP ${putStatus})` : ""}. Try again.` },
      { status: 502 }
    );
  }

  const variantPrefix = variantObjectPrefix(config.env, listing.user_id, assetId);
  // Same deterministic detail-variant URL the worker is about to write; the
  // row stays undelivered until `processing_status` flips to `ready`.
  const detailUrl = variantDeliveryUrl(config.mediaDomain, variantPrefix, "detail");

  const { data: savedMedia, error: saveError } = await adminClient
    .from("profile_media")
    .upsert(
      {
        listing_id: listing.id,
        kind: "photo",
        sort_order: sortOrder,
        url: detailUrl,
        card_url: null,
        detail_url: null,
        playback_url: null,
        thumbnail_url: null,
        original_url: null,
        original_filename: filename,
        storage_provider: "r2",
        media_key: mediaKey,
        variant_prefix: variantPrefix,
        mime_type: mimeType,
        bytes: file.size,
        duration_seconds: null,
        processing_status: "processing",
        moderation_status: "pending",
      },
      { onConflict: "media_key" }
    )
    .select(PROFILE_MEDIA_COLUMNS)
    .single();
  if (saveError || !savedMedia) {
    await deleteOriginal(mediaKey);
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the uploaded media." },
      { status: 500 }
    );
  }

  // In production the R2 event notification already queued this object; the
  // direct send keeps the pipeline working in local simulation. The consumer
  // is idempotent, so the duplicate message is harmless.
  await publishProcessingEvent({ bucket: config.originalsBucket, key: mediaKey, assetId });
  await resyncListingMedia(adminClient, listing.id);

  return NextResponse.json({ media: savedMedia }, { status: 201 });
}

/** Cloudflare Stream one-shot upload, mirroring /api/media/stream-upload. */
async function registerVideo(
  request: Request,
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  listing: ListingRef,
  file: Blob,
  filename: string,
  sortOrder: number
): Promise<NextResponse> {
  const streamConfig = getCloudflareStreamConfig();
  if (!streamConfig) {
    return NextResponse.json(
      { error: "Video uploads are not configured on this deployment. CLOUDFLARE_STREAM_API_TOKEN is missing." },
      { status: 503 }
    );
  }
  const policy = MEDIA_POLICY.video;

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  let upload: { videoUid: string; uploadURL: string };
  try {
    upload = await createDirectUpload(streamConfig, {
      maxDurationSeconds: policy.maxDurationSeconds ?? 120,
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

  try {
    const put = await fetch(upload.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type || "video/mp4" },
      body: file,
      cache: "no-store",
    });
    if (!put.ok) {
      return NextResponse.json(
        { error: `The video service refused the upload (HTTP ${put.status}). Try again.` },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach the video service. Check the connection and try again." },
      { status: 502 }
    );
  }

  const thumbnail = streamThumbnailUrl(upload.videoUid);
  const { data: savedMedia, error: saveError } = await adminClient
    .from("profile_media")
    .upsert(
      {
        listing_id: listing.id,
        kind: "video",
        sort_order: sortOrder,
        url: thumbnail,
        thumbnail_url: thumbnail,
        playback_url: null,
        original_url: null,
        original_filename: filename,
        storage_provider: "stream",
        stream_uid: upload.videoUid,
        mime_type: file.type || "video/mp4",
        bytes: file.size,
        processing_status: "processing",
        moderation_status: "pending",
      },
      { onConflict: "stream_uid" }
    )
    .select(PROFILE_MEDIA_COLUMNS)
    .single();
  if (saveError || !savedMedia) {
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the video upload." },
      { status: 500 }
    );
  }

  return NextResponse.json({ media: savedMedia }, { status: 201 });
}
