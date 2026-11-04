import { createHmac, timingSafeEqual } from "node:crypto";
import type { CloudflareStreamConfig } from "@/lib/cloudflare/config";

/**
 * Cloudflare Stream management API helpers (server-side only).
 *
 * The app never proxies video bytes: browsers upload resumingly (tus) straight
 * to the returned `uploadURL`, and playback always goes through Stream's own
 * delivery - re-fronting Stream through another CDN is against its terms.
 */

function apiBase(config: CloudflareStreamConfig): string {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/stream`;
}

async function streamRequest<T>(
  config: CloudflareStreamConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${apiBase(config)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; errors?: Array<{ code?: number; message?: string }>; result?: T }
    | null;
  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(`Cloudflare Stream ${path} failed: ${message}`);
  }
  return payload.result as T;
}

export interface StreamDirectUpload {
  videoUid: string;
  uploadURL: string;
}

/**
 * Creates a one-time resumable (tus) direct-upload target. The client PUTs/
 * PATCHes bytes straight to `uploadURL`; encoding then runs asynchronously and
 * the webhook flips the row.
 */
export async function createDirectUpload(
  config: CloudflareStreamConfig,
  options: {
    maxDurationSeconds: number;
    /** Abort uploads that stall for longer than this (tus session timeout). */
    maxUploadSeconds?: number;
    notifyURL: string;
    profileID?: string;
  }
): Promise<StreamDirectUpload> {
  const params = new URLSearchParams({
    maxDuration: String(options.maxDurationSeconds),
    notifyURL: options.notifyURL,
    requireSignedURLs: "true",
    // Keep the video private until the webhook + moderation say otherwise.
    private: "true",
  });
  if (options.maxUploadSeconds) {
    params.set("maxUpload", String(options.maxUploadSeconds));
  }
  const result = await streamRequest<{ uid: string; uploadURL?: string }>(
    config,
    `/direct-upload?${params.toString()}`,
    { method: "POST", body: "{}" }
  );
  return { videoUid: result.uid, uploadURL: result.uploadURL ?? "" };
}

export async function getStreamVideo(
  config: CloudflareStreamConfig,
  uid: string
): Promise<{ uid: string; duration?: number; status?: { step?: string; video?: { status?: string } } }> {
  return streamRequest(config, `/${encodeURIComponent(uid)}`);
}

export async function deleteStreamVideo(
  config: CloudflareStreamConfig,
  uid: string
): Promise<boolean> {
  try {
    await streamRequest(config, `/${encodeURIComponent(uid)}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

/** Short-lived playback token for a `requireSignedURLs` video. */
export async function createPlaybackToken(
  config: CloudflareStreamConfig,
  uid: string,
  expiresSeconds = 600
): Promise<string> {
  const result = await streamRequest<{ token: string }>(
    config,
    `/${encodeURIComponent(uid)}/token`,
    {
      method: "POST",
      body: JSON.stringify({ access: "view", expires: expiresSeconds }),
    }
  );
  return result.token;
}

export function streamThumbnailUrl(uid: string, timeSeconds = 1): string {
  return `https://videodelivery.net/${encodeURIComponent(uid)}/thumbnails/thumbnail.jpg?time=${timeSeconds}&quality=80`;
}

export function streamSignedManifestUrl(uid: string, token: string): string {
  return `https://videodelivery.net/${encodeURIComponent(uid)}/auth/${encodeURIComponent(token)}/manifest/video.m3u8`;
}

/**
 * Validates the `cf-webhook-signature` header: hex HMAC-SHA256 over the raw
 * request body with the webhook signing secret.
 */
export function verifyStreamWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.trim().toLowerCase();
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}
