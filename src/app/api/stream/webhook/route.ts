import { NextResponse } from "next/server";
import { getCloudflareStreamConfig } from "@/lib/cloudflare/config";
import { streamThumbnailUrl, verifyStreamWebhookSignature } from "@/lib/cloudflare/stream";
import { getAdminSupabaseClient } from "@/lib/media-records";
import { markIntentCompleteByMediaKey, streamIntentKey } from "@/lib/media-registry";

/**
 * Cloudflare Stream encoding webhook.
 *
 * `video_encoded` is the finish line of the Stream upload flow: the bytes
 * arrived via tus from the browser, Stream encoded them, and this callback
 * stores the playback metadata and flips the row from `processing` to
 * `ready`. The signature check is mandatory (no fail-open): an unverified
 * payload could otherwise mark unmoderated videos public.
 */

interface StreamWebhookEvent {
  event?: string;
  video?: {
    uid?: string;
    duration?: number;
    max_bitrate?: number;
    status?: { step?: string; video?: { status?: string } };
  };
}

export async function POST(request: Request) {
  const config = getCloudflareStreamConfig();
  if (!config || !config.webhookSecret) {
    return NextResponse.json(
      { error: "Stream webhook is not configured. CLOUDFLARE_STREAM_WEBHOOK_SECRET is missing." },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const valid = verifyStreamWebhookSignature(
    rawBody,
    request.headers.get("cf-webhook-signature"),
    config.webhookSecret
  );
  if (!valid) {
    console.warn("stream webhook: signature verification failed");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: StreamWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as StreamWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Webhook payload is not valid JSON." }, { status: 400 });
  }

  const uid = payload.video?.uid;
  if (!uid) {
    return NextResponse.json({ received: true, ignored: "no video uid" });
  }

  // Only the encode lifecycle matters here; download/derivative events for the
  // same video arrive repeatedly and must not re-trigger the row update.
  if (payload.event !== "video_encoded" && payload.event !== "video_uploading") {
    return NextResponse.json({ received: true, ignored: payload.event ?? "unknown" });
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Webhook storage is not configured." }, { status: 503 });
  }

  // The upload route created the row up front; find it in whichever table
  // owns the video.
  const profileResult = await adminClient
    .from("profile_media")
    .select("id,processing_status")
    .eq("stream_uid", uid)
    .maybeSingle();
  let table: "profile_media" | "ad_media" | null = profileResult.data ? "profile_media" : null;
  let rowId: string | null = profileResult.data?.id ?? null;
  if (!table) {
    const adResult = await adminClient
      .from("ad_media")
      .select("id,processing_status")
      .eq("stream_uid", uid)
      .maybeSingle();
    if (adResult.data) {
      table = "ad_media";
      rowId = adResult.data.id;
    }
  }
  if (!table || !rowId) {
    // An abandoned upload deleted its row already - nothing to flip.
    return NextResponse.json({ received: true, ignored: "unknown video" });
  }

  if (payload.event === "video_uploading") {
    // Still in flight; keep the row at `processing`.
    return NextResponse.json({ received: true });
  }

  const { error: updateError } = await adminClient
    .from(table)
    .update({
      duration_seconds: payload.video?.duration ?? null,
      thumbnail_url: streamThumbnailUrl(uid),
      url: streamThumbnailUrl(uid),
      playback_url: `https://videodelivery.net/${encodeURIComponent(uid)}/manifest/video.m3u8`,
      processing_status: "ready",
    })
    .eq("id", rowId);
  if (updateError) {
    console.error("stream webhook: row update failed", updateError.message);
    return NextResponse.json({ error: "Could not update the video row." }, { status: 500 });
  }

  await markIntentCompleteByMediaKey(adminClient, streamIntentKey(uid));

  return NextResponse.json({ received: true });
}
