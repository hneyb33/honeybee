/**
 * Cloudflare runtime configuration for the media pipeline.
 *
 * Two deployment shapes are supported and detected at runtime:
 *  - OpenNext on Workers: wrangler `vars`/secrets arrive through
 *    `process.env`, and native bindings (R2 buckets, the processing queue)
 *    arrive through `getCloudflareContext()`.
 *  - Anywhere else (plain `next dev`, Vercel dual-run): only `process.env`
 *    values exist, so every bucket operation goes through the S3-compatible
 *    endpoint with the scoped API token.
 *
 * Mirrors the Cloudinary helpers: config getters return `null` when the
 * deployment is not configured, and the inspector names the missing variables
 * without ever exposing a secret.
 */

const REQUIRED_R2_VARS = [
  "CF_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const;

export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  originalsBucket: string;
  mediaBucket: string;
  /** Key prefix env segment - keeps staging and production keys disjoint. */
  env: string;
  /** Custom delivery domain for the public variant bucket. */
  mediaDomain: string;
}

export interface CloudflareStreamConfig {
  accountId: string;
  apiToken: string;
  webhookSecret: string | null;
}

function trimmed(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getCloudflareR2Config(): CloudflareR2Config | null {
  const accountId = trimmed("CF_ACCOUNT_ID");
  const accessKeyId = trimmed("R2_ACCESS_KEY_ID");
  const secretAccessKey = trimmed("R2_SECRET_ACCESS_KEY");
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    originalsBucket: trimmed("R2_ORIGINALS_BUCKET") ?? "hb-originals",
    mediaBucket: trimmed("R2_MEDIA_BUCKET") ?? "hb-media",
    env: trimmed("R2_ENV") ?? "production",
    mediaDomain: trimmed("NEXT_PUBLIC_MEDIA_DOMAIN") ?? "media.honeysbees.com",
  };
}

export function getCloudflareStreamConfig(): CloudflareStreamConfig | null {
  const accountId =
    trimmed("CLOUDFLARE_STREAM_ACCOUNT_ID") ?? trimmed("CF_ACCOUNT_ID");
  const apiToken = trimmed("CLOUDFLARE_STREAM_API_TOKEN");
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken, webhookSecret: trimmed("CLOUDFLARE_STREAM_WEBHOOK_SECRET") ?? null };
}

/**
 * Reports which Cloudflare variables are present and flags the copy/paste
 * shape problems (whitespace, wrapped quotes) that silently break presigning,
 * without exposing any secret.
 */
export function inspectCloudflareEnvironment(): {
  present: Record<
    "CF_ACCOUNT_ID" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "CLOUDFLARE_STREAM_API_TOKEN",
    boolean
  >;
  warnings: string[];
  maskedAccountId: string | null;
} {
  const raw = {
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_STREAM_API_TOKEN: process.env.CLOUDFLARE_STREAM_API_TOKEN,
  };
  const warnings: string[] = [];
  const present = {} as Record<keyof typeof raw, boolean>;

  for (const [key, value] of Object.entries(raw)) {
    present[key as keyof typeof raw] = Boolean(value && value.trim());
    if (!value || !value.trim()) {
      if ((REQUIRED_R2_VARS as readonly string[]).includes(key)) {
        warnings.push(`${key} is not set in this environment.`);
      }
      continue;
    }
    if (value !== value.trim()) {
      warnings.push(`${key} has leading or trailing whitespace.`);
    }
    if (/^["']|["']$/.test(value)) {
      warnings.push(`${key} is wrapped in quotes, which will be treated literally.`);
    }
  }

  const accountId = raw.CF_ACCOUNT_ID?.trim();
  return {
    present,
    warnings,
    maskedAccountId: accountId ? `${accountId.slice(0, 4)}*** (${accountId.length} chars)` : null,
  };
}

// ---------------------------------------------------------------------------
// Native bindings (present only under the Workers runtime via OpenNext)
// ---------------------------------------------------------------------------

export interface R2ObjectLike {
  head(key: string): Promise<{ key: string; size: number; contentType?: string | null } | null>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpMetadata?: { contentType?: string | null } } | null>;
}

export interface QueueSendLike {
  send(message: unknown): Promise<unknown>;
}

export interface CloudflareBindings {
  HB_ORIGINALS?: R2ObjectLike;
  HB_MEDIA?: R2ObjectLike;
  MEDIA_PROCESS?: QueueSendLike;
}

let bindingsCache: CloudflareBindings | null = null;

/** `null` outside the Workers runtime (plain `next dev`, Vercel, scripts). */
export function getCloudflareBindings(): CloudflareBindings | null {
  if (bindingsCache) return bindingsCache;
  try {
    // Required through a variable so `next dev` bundling never resolves the
    // OpenNext helper on a runtime that cannot provide a Cloudflare context.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env: unknown };
    };
    const env = mod.getCloudflareContext().env as CloudflareBindings;
    bindingsCache = env && (env.HB_ORIGINALS || env.HB_MEDIA) ? env : null;
  } catch {
    bindingsCache = null;
  }
  return bindingsCache;
}
