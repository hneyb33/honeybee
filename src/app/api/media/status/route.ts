import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient, PROFILE_MEDIA_COLUMNS, type ProfileMediaRow } from "@/lib/media-records";

/**
 * Re-checks media that Cloudinary is still working on.
 *
 * A video whose transcode outlives the wizard's grace period is stored as
 * `processing`/`pending`. Without this endpoint the provider would keep seeing a
 * "Processing" badge that never clears, because nothing re-asks Cloudinary.
 *
 * It reuses the finalize route rather than repeating its verification logic: one
 * request per outstanding asset, forwarded with the caller's own bearer token so
 * ownership is re-proved by the existing checks.
 */

const requestSchema = z.object({
  listingId: z.string().uuid(),
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
    return NextResponse.json({ error: "A valid listing is required." }, { status: 400 });
  }

  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: listing } = await auth.client
    .from("listings")
    .select("id")
    .eq("id", parsed.data.listingId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Media status checks are not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const { data: rows, error: rowsError } = await adminClient
    .from("profile_media")
    .select(PROFILE_MEDIA_COLUMNS)
    .eq("listing_id", parsed.data.listingId)
    .eq("storage_provider", "cloudinary")
    .neq("processing_status", "ready")
    .not("cloudinary_public_id", "is", null);
  if (rowsError) {
    return NextResponse.json({ error: rowsError.message }, { status: 500 });
  }

  const pending = (rows as ProfileMediaRow[] | null) ?? [];
  if (pending.length === 0) {
    return NextResponse.json({ media: [] as ProfileMediaRow[] });
  }

  const finalizeUrl = new URL("/api/media/finalize", request.url).toString();
  const authorization = request.headers.get("authorization") ?? null;
  const refreshed: ProfileMediaRow[] = [];

  for (const row of pending) {
    if (!row.cloudinary_public_id || !row.cloudinary_asset_id) continue;
    try {
      const response = await fetch(finalizeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({
          listingId: row.listing_id,
          resourceType: row.kind === "video" ? "video" : "image",
          publicId: row.cloudinary_public_id,
          assetId: row.cloudinary_asset_id,
          // Answer once: a status refresh must never block on a transcode.
          wait: false,
        }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as { media?: ProfileMediaRow } | null;
      if (response.ok && payload?.media) refreshed.push(payload.media);
    } catch {
      // A transient Admin API failure leaves the row as it is; the next poll
      // picks it up again.
    }
  }

  return NextResponse.json({ media: refreshed });
}
