import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCloudinaryImageVariant,
  destroyCloudinaryAsset,
  getCloudinaryConfig,
  getCloudinaryDerivedAssets,
} from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS } from "@/lib/media-records";
import { markIntentComplete, resyncListingMedia } from "@/lib/media-registry";
import { extractCloudinaryMessage, isHtmlResponse } from "@/lib/media-errors";
import {
  MEDIA_UPLOADABLE_STATUSES,
  mimeTypeForFormat,
  policyForResourceType,
  type CloudinaryResourceType,
} from "@/lib/media-policy";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  resourceType: z.enum(["image", "video"]),
  publicId: z.string().min(1).max(300),
  assetId: z.string().min(1).max(128),
  /**
   * `false` makes the route answer once with the current state instead of
   * re-checking a transcoding video. The status endpoint uses it so a background
   * refresh cannot pile up slow Admin API calls.
   */
  wait: z.boolean().optional(),
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

  const { listingId, resourceType, publicId, assetId } = parsed.data;
  const waitForDerived = parsed.data.wait !== false;
  const policy = policyForResourceType(resourceType);
  const expectedPrefix = `honeybee/${auth.userId}/${listingId}/`;
  if (!publicId.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Uploaded media does not belong to this listing." },
      { status: 403 }
    );
  }

  const { data: listing, error: listingError } = await auth.client
    .from("listings")
    .select("id,verification_status")
    .eq("id", listingId)
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

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media finalization is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
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

  if (!policy.cloudinaryFormats.includes(asset.format.toLowerCase())) {
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

  if (resourceType === "video") {
    if (asset.duration === undefined) {
      return rejectAndRemoveAsset(
        cloudinary,
        resourceType,
        publicId,
        "Cloudinary could not read that video. Export it as an H.264 MP4 and try again.",
        422
      );
    }
    if (asset.duration > (policy.maxDurationSeconds ?? 0)) {
      return rejectAndRemoveAsset(
        cloudinary,
        resourceType,
        publicId,
        `Videos must be ${(policy.maxDurationSeconds ?? 0) / 60} minutes or shorter.`,
        422
      );
    }
  }

  const { count: registeredCount, error: countError } = await adminClient
    .from("profile_media")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("kind", policy.kind);
  if (countError) {
    return NextResponse.json({ error: "Could not determine the media order." }, { status: 500 });
  }

  const { data: existingMedia, error: existingMediaError } = await adminClient
    .from("profile_media")
    .select(PROFILE_MEDIA_COLUMNS)
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  if (existingMediaError) {
    return NextResponse.json({ error: "Could not verify the media record." }, { status: 500 });
  }
  if (existingMedia && existingMedia.listing_id !== listingId) {
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
    listing_id: listingId,
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
      .from("profile_media")
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
      .select(PROFILE_MEDIA_COLUMNS)
      .single();
    if (saveError || !savedMedia) {
      return NextResponse.json(
        { error: saveError?.message ?? "Could not register the uploaded media." },
        { status: 500 }
      );
    }
    await markIntentComplete(adminClient, publicId);
    await resyncListingMedia(adminClient, listingId);
    return NextResponse.json({ media: savedMedia }, { status: 201 });
  }

  // Videos have to be transcoded before a browser can stream them, so the eager
  // MP4 and poster renditions are waited for. The client treats a 202 as
  // "still preparing" and re-checks on the next save instead of failing.
  const derived = getCloudinaryDerivedAssets(asset);
  if (!derived) {
    const { data: pendingMedia, error: pendingError } = await adminClient
      .from("profile_media")
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
      .select(PROFILE_MEDIA_COLUMNS)
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
    .from("profile_media")
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
    .select(PROFILE_MEDIA_COLUMNS)
    .single();

  if (saveError || !savedVideo) {
    return NextResponse.json(
      { error: saveError?.message ?? "Could not register the uploaded media." },
      { status: 500 }
    );
  }

  await markIntentComplete(adminClient, publicId);
  // A finished video is registered, so the listing columns are rebuilt from the
  // media rows rather than appended to, keeping them free of stale URLs.
  await resyncListingMedia(adminClient, listingId);
  return NextResponse.json({ media: savedVideo }, { status: 201 });
}
