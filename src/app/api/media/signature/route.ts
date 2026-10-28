import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCloudinaryConfig,
  getCloudinaryUploadParams,
  signCloudinaryParams,
} from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  kind: z.enum(["image", "video"]),
});

const MEDIA_LIMITS = {
  image: { kind: "photo", count: 9 },
  video: { kind: "video", count: 3 },
} as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid listing and media type are required." }, { status: 400 });
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: listing, error: listingError } = await auth.client
    .from("listings")
    .select("id,verification_status")
    .eq("id", parsed.data.listingId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (listingError) {
    return NextResponse.json({ error: "Could not verify listing ownership." }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "Listing not found or not owned by this account." }, { status: 404 });
  }
  if (!["draft", "pending", "rejected"].includes(listing.verification_status)) {
    return NextResponse.json({ error: "Media can only be uploaded to a profile that is awaiting verification." }, { status: 409 });
  }

  const mediaLimit = MEDIA_LIMITS[parsed.data.kind];
  const { count, error: countError } = await auth.client
    .from("profile_media")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listing.id)
    .eq("kind", mediaLimit.kind);
  if (countError) {
    return NextResponse.json({ error: "Could not check the listing's media limit." }, { status: 500 });
  }
  if ((count ?? 0) >= mediaLimit.count) {
    return NextResponse.json({ error: `A profile can have up to ${mediaLimit.count} ${mediaLimit.kind === "photo" ? "photos" : "videos"}.` }, { status: 409 });
  }

  const cloudinary = getCloudinaryConfig();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary uploads are not configured." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `honeybee/${auth.userId}/${listing.id}/${crypto.randomUUID()}`;
  const params = getCloudinaryUploadParams(parsed.data.kind, timestamp, publicId);

  return NextResponse.json({
    cloudName: cloudinary.cloudName,
    apiKey: cloudinary.apiKey,
    timestamp,
    params,
    signature: signCloudinaryParams(params, cloudinary.apiSecret),
    resourceType: parsed.data.kind,
    publicId,
  });
}
