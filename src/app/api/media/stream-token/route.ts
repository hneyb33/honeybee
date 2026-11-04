import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareStreamConfig } from "@/lib/cloudflare/config";
import { createPlaybackToken, streamSignedManifestUrl } from "@/lib/cloudflare/stream";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";
import { getAdminSupabaseClient } from "@/lib/media-records";

/**
 * Mints a short-lived Cloudflare Stream playback token for one media row.
 *
 * Every Stream video is uploaded with `requireSignedURLs`, so the manifest in
 * the database is only playable with a token like this one. The rules mirror
 * what the public pages already show: the owner always plays, everyone else
 * only for media whose listing/ad is publicly visible and not moderation-
 * rejected. The client fetches a fresh token per playback session.
 */

const requestSchema = z.object({
  mediaId: z.string().uuid(),
});

const TOKEN_TTL_SECONDS = 600;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid media id is required." }, { status: 400 });
  }

  const config = getCloudflareStreamConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Video playback is not configured on this deployment." },
      { status: 503 }
    );
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Playback authorization is unavailable." }, { status: 503 });
  }

  // Optional bearer auth: anonymous viewers may still get a token when the
  // owning content is publicly visible.
  let authUserId: string | null = null;
  if (request.headers.get("authorization")) {
    const auth = await getAuthenticatedRequestClient(request);
    if ("error" in auth) {
      // An expired session must not block public playback - treat it as
      // anonymous and let the visibility check below decide.
      if (auth.status !== 401) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    } else {
      authUserId = auth.userId;
    }
  }

  const profileRow = await adminClient
    .from("profile_media")
    .select("id,listing_id,stream_uid,processing_status,moderation_status")
    .eq("id", parsed.data.mediaId)
    .maybeSingle();
  const source = profileRow.data ?? null;

  if (!source) {
    const adRow = await adminClient
      .from("ad_media")
      .select("id,ad_id,stream_uid,processing_status,moderation_status")
      .eq("id", parsed.data.mediaId)
      .maybeSingle();
    if (!adRow.data) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    return serveToken(adRow.data, "ad_media");
  }
  return serveToken(source, "profile_media");

  async function serveToken(
    row: {
      id: string;
      stream_uid: string | null;
      processing_status: string;
      moderation_status: string | null;
    } & Record<string, unknown>,
    from: "profile_media" | "ad_media"
  ): Promise<NextResponse> {
    if (!row.stream_uid) {
      return NextResponse.json({ error: "This media is not a Stream video." }, { status: 404 });
    }
    if (row.processing_status !== "ready") {
      return NextResponse.json(
        { error: "The video is still processing. Try again in a moment." },
        { status: 409 }
      );
    }
    if (row.moderation_status === "rejected") {
      return NextResponse.json({ error: "This video is not available." }, { status: 410 });
    }

    // Owner check + visibility gate, per scope.
    const ownerId = from === "ad_media" ? (row.ad_id as string) : (row.listing_id as string);
    if (from === "ad_media") {
      const { data: ad } = await adminClient
        .from("ads")
        .select("user_id,status")
        .eq("id", ownerId)
        .maybeSingle();
      if (!ad) return NextResponse.json({ error: "Video not found." }, { status: 404 });
      const visible = ad.status === "published";
      if (!visible && ad.user_id !== authUserId) {
        return NextResponse.json({ error: "This video is not publicly available." }, { status: 403 });
      }
    } else {
      const { data: listing } = await adminClient
        .from("listings")
        .select("user_id,verification_status")
        .eq("id", ownerId)
        .maybeSingle();
      if (!listing) return NextResponse.json({ error: "Video not found." }, { status: 404 });
      const visible = listing.verification_status === "verified";
      if (!visible && listing.user_id !== authUserId) {
        return NextResponse.json({ error: "This video is not publicly available." }, { status: 403 });
      }
    }

    try {
      const token = await createPlaybackToken(config, row.stream_uid, TOKEN_TTL_SECONDS);
      return NextResponse.json({
        playbackUrl: streamSignedManifestUrl(row.stream_uid, token),
        thumbnailUrl: `https://videodelivery.net/${encodeURIComponent(row.stream_uid)}/thumbnails/thumbnail.jpg`,
        expiresIn: TOKEN_TTL_SECONDS,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Could not start playback. Try again in a moment.",
          detail: error instanceof Error ? error.message : undefined,
        },
        { status: 502 }
      );
    }
  }
}
