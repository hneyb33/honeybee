import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCloudinaryConfig,
  getCloudinaryUploadParams,
  inspectCloudinaryEnvironment,
  signCloudinaryParams,
} from "@/lib/cloudinary";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient } from "@/lib/media-records";
import {
  AD_UPLOADABLE_STATUSES,
  MEDIA_UPLOADABLE_STATUSES,
  mediaUploadPrefix,
  policyForResourceType,
  type CloudinaryResourceType,
  type MediaTarget,
} from "@/lib/media-policy";

const requestSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    adId: z.string().uuid().optional(),
    resourceType: z.enum(["image", "video"]),
    /**
     * Supplied when re-authorising a chunk of an upload that already has a public
     * id, so a long upload never runs on an expired signature.
     */
    publicId: z.string().min(1).max(300).optional(),
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
      { error: "A valid listing or ad and media type are required." },
      { status: 400 }
    );
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { resourceType } = parsed.data;
  const target: MediaTarget = parsed.data.adId
    ? { scope: "ad", id: parsed.data.adId }
    : { scope: "listing", id: parsed.data.listingId as string };
  const policy = policyForResourceType(resourceType);
  const expectedPrefix = mediaUploadPrefix(auth.userId, target);

  if (parsed.data.publicId && !parsed.data.publicId.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "That upload authorization does not belong to this profile." },
      { status: 403 }
    );
  }

  // Ownership + uploadable-state check differs per scope, but the outcome is the
  // same: a row we can attach media to, or an error response.
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
          error: "This profile is suspended, so media cannot be changed. Contact support to restore it.",
        },
        { status: 409 }
      );
    }
  }

  const cloudinary = getCloudinaryConfig();
  if (!cloudinary) {
    // The previous generic message sent support conversations to the wrong
    // place; name the variable that is actually missing.
    const environment = inspectCloudinaryEnvironment();
    const missing = (Object.keys(environment.present) as Array<keyof typeof environment.present>)
      .filter((key) => !environment.present[key]);
    return NextResponse.json(
      {
        error: missing.length
          ? `Media uploads are not configured on this deployment. Missing: ${missing.join(", ")}.`
          : "Media uploads are not configured on this deployment.",
        warnings: environment.warnings,
      },
      { status: 503 }
    );
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media uploads are not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const publicId = parsed.data.publicId ?? `${expectedPrefix}${crypto.randomUUID()}`;
  const isReauthorization = Boolean(parsed.data.publicId);

  if (!isReauthorization) {
    // Registered media is counted from the scope's own table so an ad never
    // borrows a profile's portfolio slots (or vice versa).
    const registeredQuery =
      target.scope === "ad"
        ? adminClient
            .from("ad_media")
            .select("id", { count: "exact", head: true })
            .eq("ad_id", target.id)
            .eq("kind", policy.kind)
        : adminClient
            .from("profile_media")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", target.id)
            .eq("kind", policy.kind);
    const { count: registered } = await registeredQuery;

    // Upload-intent tracking is keyed to listings (its FK), so ads rely purely
    // on registered-row counts for the limit. That is a safe, slightly looser
    // guard: a concurrent abandoned upload can only over-count, never exceed the
    // per-target ceiling once finalize has landed.
    let pendingCount = 0;
    if (target.scope === "listing") {
      const { data: openIntents, error: intentError } = await adminClient
        .from("media_upload_intents")
        .select("cloudinary_public_id")
        .eq("listing_id", target.id)
        .eq("resource_type", resourceType)
        .is("completed_at", null)
        .gt("requested_at", new Date(Date.now() - OPEN_INTENT_TTL_MS).toISOString());
      if (intentError) {
        // Deployment predates the intents migration: fall back to registered rows
        // rather than blocking every upload.
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

    if (target.scope === "listing") {
      const { error: insertIntentError } = await adminClient.from("media_upload_intents").upsert(
        {
          listing_id: target.id,
          user_id: auth.userId,
          cloudinary_public_id: publicId,
          resource_type: resourceType,
          requested_at: new Date().toISOString(),
          completed_at: null,
        },
        { onConflict: "cloudinary_public_id" }
      );
      if (insertIntentError) {
        console.warn("Could not record the upload intent:", insertIntentError.message);
      }
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = getCloudinaryUploadParams(resourceType, timestamp, publicId);

  return NextResponse.json({
    cloudName: cloudinary.cloudName,
    apiKey: cloudinary.apiKey,
    timestamp,
    params,
    signature: signCloudinaryParams(params, cloudinary.apiSecret),
    resourceType,
    publicId,
  });
}
