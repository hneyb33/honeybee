import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { CloudinaryResourceType } from "@/lib/cloudinary";
import {
  destroyCloudinaryAsset,
  getCloudinaryConfig,
  getCloudinaryDerivedAssets,
} from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  kind: z.enum(["image", "video"]),
  publicId: z.string().min(1).max(255),
  assetId: z.string().min(1).max(128),
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

const MAX_BYTES: Record<CloudinaryResourceType, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const MAX_VIDEO_DURATION_SECONDS = 120;

const MEDIA_COUNTS: Record<CloudinaryResourceType, number> = {
  image: 9,
  video: 3,
};

const ALLOWED_FORMATS: Record<CloudinaryResourceType, string[]> = {
  image: ["jpg", "jpeg", "png", "webp"],
  video: ["mp4", "webm", "mov"],
};

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
  kind: CloudinaryResourceType,
  publicId: string,
  message: string,
  status: number
) {
  try {
    const removed = await destroyCloudinaryAsset(cloudinary, kind, publicId);
    if (!removed) {
      return NextResponse.json(
        { error: "The upload was rejected, but Cloudinary could not remove the file. Contact support." },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "The upload was rejected, but Cloudinary cleanup failed. Contact support." },
      { status: 502 }
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

  const { listingId, kind, publicId, assetId } = parsed.data;
  const expectedPrefix = `honeybee/${auth.userId}/${listingId}/`;
  if (!publicId.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Uploaded media does not belong to this listing." }, { status: 403 });
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
    return NextResponse.json({ error: "Listing not found or not owned by this account." }, { status: 404 });
  }
  if (!["draft", "pending", "rejected"].includes(listing.verification_status)) {
    return NextResponse.json({ error: "Media can only be added before a profile is verified." }, { status: 409 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Media finalization is not configured." }, { status: 503 });
  }

  const cloudinary = getCloudinaryConfig();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary uploads are not configured." }, { status: 503 });
  }

  const encodedPublicId = publicId.split("/").map(encodeURIComponent).join("/");
  const resourceUrl = new URL(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinary.cloudName)}/resources/${kind}/upload/${encodedPublicId}`
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
    return NextResponse.json({ error: "Could not reach Cloudinary to confirm the uploaded media." }, { status: 502 });
  }
  if (!cloudinaryResponse.ok) {
    return NextResponse.json({ error: "Cloudinary could not confirm the uploaded media." }, { status: 502 });
  }

  let cloudinaryPayload: unknown;
  try {
    cloudinaryPayload = await cloudinaryResponse.json();
  } catch {
    return NextResponse.json({ error: "Cloudinary returned invalid asset details." }, { status: 502 });
  }

  const assetResult = cloudinaryAssetSchema.safeParse(cloudinaryPayload);
  if (!assetResult.success) {
    return NextResponse.json({ error: "Cloudinary returned incomplete asset details." }, { status: 502 });
  }

  const asset = assetResult.data;
  if (
    asset.asset_id !== assetId ||
    asset.public_id !== publicId ||
    asset.resource_type !== kind ||
    !isCloudinaryUrl(asset.secure_url, cloudinary.cloudName)
  ) {
    return NextResponse.json({ error: "Uploaded asset details do not match the authorized upload." }, { status: 403 });
  }

  if (!ALLOWED_FORMATS[kind].includes(asset.format.toLowerCase())) {
    return rejectAndRemoveAsset(cloudinary, kind, publicId, "This media format is not supported.", 422);
  }

  if (asset.bytes === 0 || asset.bytes > MAX_BYTES[kind]) {
    return rejectAndRemoveAsset(
      cloudinary,
      kind,
      publicId,
      asset.bytes === 0 ? "Empty files cannot be uploaded." : "The uploaded file exceeds the allowed size.",
      asset.bytes === 0 ? 422 : 413
    );
  }
  if (kind === "video" && asset.duration === undefined) {
    return rejectAndRemoveAsset(
      cloudinary,
      kind,
      publicId,
      "Cloudinary could not verify the video duration. Please try another video.",
      502
    );
  }
  if (
    kind === "video" &&
    asset.duration !== undefined &&
    asset.duration > MAX_VIDEO_DURATION_SECONDS
  ) {
    return rejectAndRemoveAsset(
      cloudinary,
      kind,
      publicId,
      "Videos must be 2 minutes or shorter.",
      422
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const mediaKind = kind === "image" ? "photo" : "video";
  const { count, error: countError } = await adminClient
    .from("profile_media")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("kind", mediaKind);
  if (countError) {
    return NextResponse.json({ error: "Could not determine the media order." }, { status: 500 });
  }
  const { data: existingMedia, error: existingMediaError } = await adminClient
    .from("profile_media")
    .select("id,listing_id,url,kind,sort_order,thumbnail_url,processing_status,cloudinary_public_id,cloudinary_asset_id")
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  if (existingMediaError) {
    return NextResponse.json({ error: "Could not verify the media record." }, { status: 500 });
  }
  if (existingMedia && existingMedia.listing_id !== listingId) {
    return NextResponse.json({ error: "Uploaded media is already registered to another listing." }, { status: 409 });
  }
  if (!existingMedia && (count ?? 0) >= MEDIA_COUNTS[kind]) {
    return rejectAndRemoveAsset(
      cloudinary,
      kind,
      publicId,
      `A profile can have up to ${MEDIA_COUNTS[kind]} ${mediaKind === "photo" ? "photos" : "videos"}.`,
      409
    );
  }

  const sortOrder = existingMedia?.sort_order ?? count ?? 0;
  const mediaMetadata = {
    listing_id: listingId,
    kind: mediaKind,
    sort_order: sortOrder,
    original_url: asset.secure_url,
    processing_status: "ready",
    storage_provider: "cloudinary",
    cloudinary_public_id: publicId,
    cloudinary_asset_id: asset.asset_id,
    mime_type: kind === "image"
      ? asset.format.toLowerCase() === "jpg" ? "image/jpeg" : `image/${asset.format.toLowerCase()}`
      : asset.format.toLowerCase() === "mov" ? "video/quicktime" : `video/${asset.format.toLowerCase()}`,
    bytes: asset.bytes,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration_seconds: asset.duration ?? null,
  };
  const derived = getCloudinaryDerivedAssets(asset, kind);
  if (!derived) {
    const { data: pendingMedia, error: pendingError } = await adminClient
      .from("profile_media")
      .upsert({
        ...mediaMetadata,
        url: asset.secure_url,
        thumbnail_url: null,
        processing_status: "processing",
        card_url: null,
        detail_url: null,
        playback_url: null,
      }, { onConflict: "cloudinary_public_id" })
      .select("id,listing_id,url,kind,sort_order,thumbnail_url,processing_status,cloudinary_public_id,cloudinary_asset_id")
      .single();
    if (pendingError || !pendingMedia) {
      return NextResponse.json({ error: pendingError?.message ?? "Could not register the processing media." }, { status: 500 });
    }
    return NextResponse.json({ media: pendingMedia, pending: true }, { status: 202 });
  }
  if (derived.some((item) => !isCloudinaryUrl(item.secure_url, cloudinary.cloudName))) {
    return NextResponse.json({ error: "Cloudinary returned an invalid media variant URL." }, { status: 502 });
  }

  const cardUrl = kind === "image" ? derived[0].secure_url : null;
  const detailUrl = kind === "image" ? derived[1].secure_url : null;
  const playbackUrl = kind === "video" ? derived[0].secure_url : null;
  const thumbnailUrl = kind === "video" ? derived[1].secure_url : null;
  const url = detailUrl ?? playbackUrl;
  if (!url || (kind === "image" && (!cardUrl || !detailUrl))) {
    return NextResponse.json({ error: "Cloudinary did not return the required media variants." }, { status: 502 });
  }

  const { data: savedMedia, error: saveError } = await adminClient
    .from("profile_media")
    .upsert({
      ...mediaMetadata,
      url,
      thumbnail_url: thumbnailUrl,
      card_url: cardUrl,
      detail_url: detailUrl,
      playback_url: playbackUrl,
    }, { onConflict: "cloudinary_public_id" })
    .select("id,listing_id,url,kind,sort_order,thumbnail_url,processing_status,cloudinary_public_id,cloudinary_asset_id")
    .single();

  if (saveError || !savedMedia) {
    return NextResponse.json({ error: saveError?.message ?? "Could not register the uploaded media." }, { status: 500 });
  }

  if (kind === "image") {
    const { data: listingData, error: listingReadError } = await adminClient
      .from("listings")
      .select("images,cover_image")
      .eq("id", listingId)
      .single();
    if (listingReadError) {
      return NextResponse.json({ error: listingReadError.message }, { status: 500 });
    }

    const existingImages = Array.isArray(listingData.images)
      ? listingData.images.filter((image): image is string => typeof image === "string")
      : [];
    const nextImages = existingImages.includes(detailUrl)
      ? existingImages
      : [...existingImages, detailUrl];
    const { error: listingUpdateError } = await adminClient
      .from("listings")
      .update({
        images: nextImages,
        cover_image: listingData.cover_image || cardUrl,
      })
      .eq("id", listingId);
    if (listingUpdateError) {
      return NextResponse.json({ error: listingUpdateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ media: savedMedia }, { status: 201 });
}
