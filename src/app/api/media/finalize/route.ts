import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCloudinaryImageVariant,
  destroyCloudinaryAsset,
  getCloudinaryConfig,
  getCloudinaryDerivedAssets,
} from "@/lib/cloudinary";
import { getCloudflareR2Config } from "@/lib/cloudflare/config";
import { headOriginal, publishProcessingEvent, readOriginalPrefix, deleteOriginal } from "@/lib/cloudflare/r2";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS, AD_MEDIA_COLUMNS } from "@/lib/media-records";
import type { AdMediaRow, ProfileMediaRow } from "@/lib/media-records";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteAdMediaRowByMediaKey,
  deleteMediaRowByMediaKey,
  findMediaRowByMediaKey,
  markIntentComplete,
  markIntentCompleteByMediaKey,
  resyncAdMedia,
  resyncListingMedia,
} from "@/lib/media-registry";
import { extractCloudinaryMessage, isHtmlResponse } from "@/lib/media-errors";
import { isAllowedDetectedFormat, sniffImageFormat } from "@/lib/media-magic";
import {
  AD_UPLOADABLE_STATUSES,
  MEDIA_UPLOADABLE_STATUSES,
  mediaUploadPrefix,
  mimeTypeForFormat,
  parseMediaObjectKey,
  policyForResourceType,
  variantObjectPrefix,
  variantDeliveryUrl,
  type CloudinaryResourceType,
  type MediaPolicyEntry,
  type MediaTarget,
} from "@/lib/media-policy";

const requestSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    adId: z.string().uuid().optional(),
    resourceType: z.enum(["image", "video"]),
    publicId: z.string().min(1).max(300).optional(),
    assetId: z.string().min(1).max(128).optional(),
    /** Immutable R2 key for the presigned-upload flow (photos only). */
    mediaKey: z.string().min(1).max(300).optional(),
    /**
     * `false` makes the route answer once with the current state instead of
     * re-checking a transcoding video. The status endpoint uses it so a background
     * refresh cannot pile up slow Admin API calls.
     */
    wait: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.listingId) !== Boolean(value.adId), {
    message: "Exactly one of listingId or adId is required.",
  })
  .refine((value) => Boolean(value.mediaKey) !== Boolean(value.publicId), {
    message: "Exactly one of mediaKey or publicId is required.",
  })
  .refine((value) => !value.publicId || Boolean(value.assetId), {
    message: "A Cloudinary upload must report its asset id.",
  });

const cloudinaryAssetSchema = z.object({
  asset_id: z.string(),
  public_id: z.string(),
  resource_type: z.enum(["image", "video"]),
  secure_url: z.string().url(),
  format: z.string(),
  bytes: z.number().int().nonnegative(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration: z.number().nonnegative().optional(),
  derived: z.array(z.object({
    secure_url: z.string().url(),
    transformation: z.string(),
    format: z.string(),
  })).optional(),
});

function isCloudinaryUrl(value: string, cloudName: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
}

async function rejectAndRemoveAsset(
  cloudinary: NonNullable<ReturnType<typeof getCloudinaryConfig>>,
  resourceType: CloudinaryResourceType,
  publicId: string,
  message: string,
  status: number
) {
  let removed = false;
  try {
    removed = await destroyCloudinaryAsset(cloudinary, resourceType, publicId);
  } catch {
    removed = false;
  }
  if (!removed) {
    // The rejection reason is what the provider needs to act on, so it stays in
    // the message even when cleanup also failed.
    return NextResponse.json(
      {
        error: `${message} Cloudinary could not remove the file, so it may still be listed in your media library - contact support if it is.`,
      },
      { status }
    );
  }
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Uploaded media details are invalid." }, { status: 400 });
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { resourceType, assetId } = parsed.data;
  const publicId = parsed.data.publicId ?? "";
  const target: MediaTarget = parsed.data.adId
    ? { scope: "ad", id: parsed.data.adId }
    : { scope: "listing", id: parsed.data.listingId as string };
  const isAd = target.scope === "ad";
  const mediaTable = isAd ? "ad_media" : "profile_media";
  const mediaColumns = isAd ? AD_MEDIA_COLUMNS : PROFILE_MEDIA_COLUMNS;
  const waitForDerived = parsed.data.wait !== false;
  const policy = policyForResourceType(resourceType);
  const expectedPrefix = mediaUploadPrefix(auth.userId, target);
  if (publicId && !publicId.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Uploaded media does not belong to this listing." },
      { status: 403 }
    );
  }

  if (isAd) {
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
      return NextResponse.json({ error: "Ad not found or not owned by this account." }, { status: 404 });
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
        { error: "This profile is suspended, so media cannot be changed." },
        { status: 409 }
      );
    }
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media finalization is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  // ---------------------------------------------------------------------------
  // R2 branch: verify the presigned original, register a `processing` row and
  // let the queue worker flip it to `ready` once variants exist. A second call
  // (client polling / status refresh) returns the current row state, mirroring
  // the 202-until-transcode video semantics of the Cloudinary flow.
  // ---------------------------------------------------------------------------
  if (parsed.data.mediaKey) {
    return finalizeR2Media({
      authUserId: auth.userId,
      adminClient,
      target,
      isAd,
      mediaTable,
      mediaColumns,
      policy,
      mediaKey: parsed.data.mediaKey,
    });
  }

  const cloudinary = getCloudinaryConfig();
  if (!cloudinary) {
    return NextResponse.json(
      { error: "Media uploads are not configured. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required." },
      { status: 503 }
    );
  }

  const encodedPublicId = publicId.split("/").map(encodeURIComponent).join("/");
  const resourceUrl = new URL(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinary.cloudName)}/resources/${resourceType}/upload/${encodedPublicId}`
  );
  resourceUrl.searchParams.set("derived", "true");
  // The single-resource detail endpoint omits `duration` (and codec/frame-rate)
  // unless media_metadata is requested, so without this every video would look
  // unreadable and get wrongly rejected below.
  resourceUrl.searchParams.set("media_metadata", "true");

  let cloudinaryResponse: Response;
  try {
    cloudinaryResponse = await fetch(resourceUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${cloudinary.apiKey}:${cloudinary.apiSecret}`).toString("base64")}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Cloudinary to confirm the uploaded media. Try again in a moment." },
      { status: 502 }
    );
  }

  if (!cloudinaryResponse.ok) {
    const contentType = cloudinaryResponse.headers.get("content-type");
    const text = await cloudinaryResponse.text().catch(() => "");
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    const reason = extractCloudinaryMessage(payload);
    if (cloudinaryResponse.status === 404) {
      return NextResponse.json(
        {
          error: "Cloudinary has no record of that upload yet. If the upload was interrupted, remove the file and upload it again.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: isHtmlResponse(contentType)
          ? "Could not confirm the upload with Cloudinary (the service returned an unexpected page)."
          : `Could not confirm the upload with Cloudinary${reason ? `: ${reason}` : "."}`,
      },
      { status: 502 }
    );
  }

  let cloudinaryPayload: unknown;
  try {
    cloudinaryPayload = await cloudinaryResponse.json();
  } catch {
    return NextResponse.json(
      { error: "Cloudinary returned invalid asset details." },
      { status: 502 }
    );
  }

  const assetResult = cloudinaryAssetSchema.safeParse(cloudinaryPayload);
  if (!assetResult.success) {
    return NextResponse.json(
      { error: "Cloudinary returned incomplete asset details." },
      { status: 502 }
    );
  }

  const asset = assetResult.data;
  if (
    asset.asset_id !== assetId ||
    asset.public_id !== publicId ||
    asset.resource_type !== resourceType ||
    !isCloudinaryUrl(asset.secure_url, cloudinary.cloudName)
  ) {
    return NextResponse.json(
      { error: "Uploaded asset details do not match the authorized upload." },
      { status: 403 }
    );
  }

  if (!policy.allowedFormats.includes(asset.format.toLowerCase())) {
    return rejectAndRemoveAsset(
      cloudinary,
      resourceType,
      publicId,
      "That file format is not supported. Use JPEG, PNG or WebP photos and MP4, WebM or QuickTime videos.",
      422
    );
  }

  if (asset.bytes === 0 || asset.bytes > policy.maxBytes) {
    return rejectAndRemoveAsset(
      cloudinary,
      resourceType,
      publicId,
      asset.bytes === 0
        ? "Empty files cannot be uploaded."
        : `The uploaded file is larger than the ${Math.round(policy.maxBytes / 1_000_000)} MB limit for a ${policy.label}.`,
      asset.bytes === 0 ? 422 : 413
    );
  }

  if (resourceType === "video" && asset.duration !== undefined &&
      asset.duration > (policy.maxDurationSeconds ?? 0)) {
    return rejectAndRemoveAsset(
      cloudinary,
      resourceType,
      publicId,
      `Videos must be ${(policy.maxDurationSeconds ?? 0) / 60} minutes or shorter.`,
      422
    );
  }

  // Cloudinary has not reported a duration yet (the media probe is still
  // running). Never destroy the asset for that: fall through to the processing
  // path so the status poll re-checks it instead of losing a valid upload.
  const videoDurationUnknown = resourceType === "video" && asset.duration === undefined;

  const ownerKey = isAd ? "ad_id" : "listing_id";

  const { count: registeredCount, error: countError } = await adminClient
    .from(mediaTable)
    .select("id", { count: "exact", head: true })
    .eq(ownerKey, target.id)
    .eq("kind", policy.kind);
  if (countError) {
    return NextResponse.json({ error: "Could not determine the media order." }, { status: 500 });
  }

  const { data: existingMedia, error: existingMediaError } = await adminClient
    .from(mediaTable)
    .select(mediaColumns)
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  if (existingMediaError) {
    return NextResponse.json({ error: "Could not verify the media record." }, { status: 500 });
  }
  if (existingMedia && (existingMedia as Record<string, unknown>)[ownerKey] !== target.id) {
    return NextResponse.json(
      { error: "Uploaded media is already registered to another listing." },
      { status: 409 }
    );
  }
  if (!existingMedia && (registeredCount ?? 0) >= policy.maxCount) {
    return rejectAndRemoveAsset(
      cloudinary,
      resourceType,
      publicId,
      `A profile can have up to ${policy.maxCount} ${policy.unitLabel}.`,
      409
    );
  }

  const sortOrder = existingMedia?.sort_order ?? registeredCount ?? 0;
  const mediaMetadata = {
    [ownerKey]: target.id,
    kind: policy.kind,
    sort_order: sortOrder,
    original_url: asset.secure_url,
    original_filename: publicId.split("/").pop() ?? null,
    storage_provider: "cloudinary",
    cloudinary_public_id: publicId,
    cloudinary_asset_id: asset.asset_id,
    mime_type: mimeTypeForFormat(policy.kind, asset.format),
    bytes: asset.bytes,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration_seconds: asset.duration ?? null,
    processing_status: "ready",
  };

  // Images follow Cloudinary's "upload once, transform on demand" model: the
  // card and detail renditions are URLs, not stored assets, so an image is
  // instantly ready and burns no transformation credits until someone views it.
  if (resourceType === "image") {
    const cardUrl = buildCloudinaryImageVariant(asset.secure_url, "card");
    const detailUrl = buildCloudinaryImageVariant(asset.secure_url, "detail");
    if (
      !isCloudinaryUrl(cardUrl, cloudinary.cloudName) ||
      !isCloudinaryUrl(detailUrl, cloudinary.cloudName)
    ) {
      return NextResponse.json(
        { error: "Cloudinary returned an unexpected media URL." },
        { status: 502 }
      );
    }
    const { data: savedMedia, error: saveError } = await adminClient
      .from(mediaTable)
      .upsert(
        {
          ...mediaMetadata,
          url: detailUrl,
          card_url: cardUrl,
          detail_url: detailUrl,
          playback_url: null,
          thumbnail_url: null,
        },
        { onConflict: "cloudinary_public_id" }
      )
      .select(mediaColumns)
      .single();
    if (saveError || !savedMedia) {
      return NextResponse.json(
        { error: saveError?.message ?? "Could not register the uploaded media." },
        { status: 500 }
      );
    }
    if (!isAd) await markIntentComplete(adminClient, publicId);
    await (isAd ? resyncAdMedia(adminClient, target.id) : resyncListingMedia(adminClient, target.id));
    return NextResponse.json({ media: savedMedia }, { status: 201 });
  }

  // Videos have to be transcoded before a browser can stream them, so the eager
  // MP4 and poster renditions are waited for. The client treats a 202 as
  // "still preparing" and re-checks on the next save instead of failing.
  const derived = getCloudinaryDerivedAssets(asset);
  if (!derived || videoDurationUnknown) {
    const { data: pendingMedia, error: pendingError } = await adminClient
      .from(mediaTable)
      .upsert(
        {
          ...mediaMetadata,
          url: asset.secure_url,
          card_url: null,
          detail_url: null,
          playback_url: null,
          thumbnail_url: null,
          processing_status: waitForDerived ? "processing" : "pending",
        },
        { onConflict: "cloudinary_public_id" }
      )
      .select(mediaColumns)
      .single();
    if (pendingError || !pendingMedia) {
      return NextResponse.json(
        { error: pendingError?.message ?? "Could not register the processing media." },
        { status: 500 }
      );
    }
    return NextResponse.json({ media: pendingMedia, pending: true }, { status: 202 });
  }

  if (derived.some((item) => !isCloudinaryUrl(item.secure_url, cloudinary.cloudName))) {
    return NextResponse.json(
      { error: "Cloudinary returned an invalid media variant URL." },
      { status: 502 }
    );
  }

  const playbackUrl = derived[0].secure_url;
  const thumbnailUrl = derived[1].secure_url;

  const { data: savedVideo, error: saveError } = await adminClient
    .from(mediaTable)
    .upsert(
      {
        ...mediaMetadata,
        url: playbackUrl,
        card_url: null,
        detail_url: null,
        playback_url: playbackUrl,
        thumbnail_url: thumbnailUrl,
      },
      { onConflict: "cloudinary_public_id" }
    )
    .select(mediaColumns)
    .single();

  if (saveError || !savedVideo) {
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the uploaded media." },
      { status: 500 }
    );
  }

  if (!isAd) await markIntentComplete(adminClient, publicId);
  // A finished video is registered, so the listing/ad columns are rebuilt from
  // the media rows rather than appended to, keeping them free of stale URLs.
  await (isAd ? resyncAdMedia(adminClient, target.id) : resyncListingMedia(adminClient, target.id));
  return NextResponse.json({ media: savedVideo }, { status: 201 });
}

// ---------------------------------------------------------------------------
// R2 finalize
// ---------------------------------------------------------------------------

interface R2FinalizeArgs {
  authUserId: string;
  adminClient: SupabaseClient;
  target: MediaTarget;
  isAd: boolean;
  mediaTable: "profile_media" | "ad_media";
  mediaColumns: string;
  policy: MediaPolicyEntry;
  mediaKey: string;
}

/**
 * Verifies a presigned R2 original and registers (or re-reports) its row.
 * The response codes match the Cloudinary video flow: 201 with the row once
 * the worker has produced the variants, 202 with `pending` while the queue
 * consumer is still working, so the existing client polling loop needs no
 * provider-specific branch.
 */
async function finalizeR2Media(args: R2FinalizeArgs): Promise<NextResponse> {
  const config = getCloudflareR2Config();
  if (!config) {
    return NextResponse.json(
      { error: "Media storage is not configured. CF_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required." },
      { status: 503 }
    );
  }
  if (args.policy.kind !== "photo") {
    return NextResponse.json(
      { error: "Videos upload through /api/media/stream-upload." },
      { status: 400 }
    );
  }

  const owner = parseMediaObjectKey(args.mediaKey);
  if (
    !owner ||
    owner.userId !== args.authUserId ||
    owner.scope !== args.target.scope ||
    owner.id !== args.target.id ||
    owner.env !== config.env
  ) {
    return NextResponse.json(
      { error: "Uploaded media does not belong to this listing." },
      { status: 403 }
    );
  }

  const ownerKey = args.isAd ? "ad_id" : "listing_id";
  const existing = await findMediaRowByMediaKey(args.adminClient, args.mediaTable, args.mediaKey);
  if (existing && (existing as unknown as Record<string, unknown>)[ownerKey] !== args.target.id) {
    return NextResponse.json(
      { error: "Uploaded media is already registered to another listing." },
      { status: 409 }
    );
  }
  // The worker finished the variants - report the ready row and stop.
  if (existing?.processing_status === "ready") {
    return NextResponse.json({ media: existing }, { status: 201 });
  }

  const head = await headOriginal(args.mediaKey);
  if (!head) {
    return NextResponse.json(
      {
        error: "Honeybee has no record of that upload yet. If the upload was interrupted, remove the file and upload it again.",
      },
      { status: 404 }
    );
  }

  if (head.sizeBytes === 0 || head.sizeBytes > args.policy.maxBytes) {
    return rejectR2Original(args, existing,
      head.sizeBytes === 0
        ? "Empty files cannot be uploaded."
        : `The uploaded file is larger than the ${Math.round(args.policy.maxBytes / 1_000_000)} MB limit for a ${args.policy.label}.`,
      head.sizeBytes === 0 ? 422 : 413);
  }

  const prefixBytes = await readOriginalPrefix(args.mediaKey, 32);
  if (!prefixBytes) {
    return NextResponse.json(
      { error: "Could not read the uploaded file. Try again in a moment." },
      { status: 502 }
    );
  }
  if (!isAllowedDetectedFormat("photo", args.policy.allowedFormats, prefixBytes)) {
    return rejectR2Original(args, existing,
      "That file format is not supported. Use JPEG, PNG or WebP photos.", 422);
  }
  const detectedFormat = sniffImageFormat(prefixBytes) ?? "jpg";

  if (!existing) {
    const { count: registeredCount, error: countError } = await args.adminClient
      .from(args.mediaTable)
      .select("id", { count: "exact", head: true })
      .eq(ownerKey, args.target.id)
      .eq("kind", args.policy.kind);
    if (countError) {
      return NextResponse.json({ error: "Could not determine the media order." }, { status: 500 });
    }
    if ((registeredCount ?? 0) >= args.policy.maxCount) {
      return rejectR2Original(args, null,
        `A profile can have up to ${args.policy.maxCount} ${args.policy.unitLabel}.`, 409);
    }
  }

  const variantPrefix = variantObjectPrefix(config.env, owner.userId, owner.assetId);
  // `url` points at the deterministic detail variant the worker is about to
  // write. The row stays hidden (see `isPublicMediaReady`) until it flips to
  // `ready`, so the URL is never rendered while it would still 404.
  const detailUrl = variantDeliveryUrl(config.mediaDomain, variantPrefix, "detail");
  let sortOrder = existing?.sort_order ?? 0;
  if (!existing) {
    const { count: currentCount } = await args.adminClient
      .from(args.mediaTable)
      .select("id", { count: "exact", head: true })
      .eq(ownerKey, args.target.id)
      .eq("kind", args.policy.kind);
    sortOrder = currentCount ?? 0;
  }

  const { data: savedMedia, error: saveError } = await args.adminClient
    .from(args.mediaTable)
    .upsert(
      {
        [ownerKey]: args.target.id,
        kind: args.policy.kind,
        sort_order: sortOrder,
        url: detailUrl,
        card_url: existing?.card_url ?? null,
        detail_url: existing?.detail_url ?? null,
        playback_url: null,
        thumbnail_url: existing?.thumbnail_url ?? null,
        original_url: null,
        original_filename: owner.filename,
        storage_provider: "r2",
        media_key: args.mediaKey,
        variant_prefix: variantPrefix,
        mime_type: mimeTypeForFormat("photo", detectedFormat),
        bytes: head.sizeBytes,
        duration_seconds: null,
        processing_status: "processing",
        moderation_status: "pending",
      },
      { onConflict: "media_key" }
    )
    .select(args.mediaColumns)
    .single();
  if (saveError || !savedMedia) {
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the uploaded media." },
      { status: 500 }
    );
  }

  if (!args.isAd) await markIntentCompleteByMediaKey(args.adminClient, args.mediaKey);

  // In production the R2 event notification already queued this object; the
  // direct send makes the pipeline work inside the local `wrangler dev`
  // simulation too, and the consumer is idempotent.
  await publishProcessingEvent({
    bucket: config.originalsBucket,
    key: args.mediaKey,
    assetId: owner.assetId,
  });

  return NextResponse.json({ media: savedMedia, pending: true }, { status: 202 });
}

/** Deletes a rejected original (and its row) before it is ever delivered. */
async function rejectR2Original(
  args: R2FinalizeArgs,
  existing: ProfileMediaRow | AdMediaRow | null,
  message: string,
  status: number
): Promise<NextResponse> {
  const removed = await deleteOriginal(args.mediaKey);
  if (existing) {
    await (args.isAd
      ? deleteAdMediaRowByMediaKey(args.adminClient, args.mediaKey)
      : deleteMediaRowByMediaKey(args.adminClient, args.mediaKey));
    await (args.isAd
      ? resyncAdMedia(args.adminClient, args.target.id)
      : resyncListingMedia(args.adminClient, args.target.id));
  }
  if (!removed) {
    return NextResponse.json(
      { error: `${message} The storage service could not remove the file - contact support if it lingers.` },
      { status }
    );
  }
  return NextResponse.json({ error: message }, { status });
}
