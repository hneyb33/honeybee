/**
 * Cloudflare Turnstile verification (server-side only).
 *
 * Mirrors the project's "null when unconfigured" pattern: when neither the
 * sitekey nor the secret are set (plain `next dev`, scripts) verification is
 * skipped so local flows keep working. The moment the secret is configured the
 * check is strict - a missing or invalid token is a rejection, never a
 * fail-open.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function trimmed(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getTurnstileSiteKey(): string | null {
  return trimmed("NEXT_PUBLIC_TURNSTILE_SITEKEY") ?? null;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(trimmed("TURNSTILE_SECRET"));
}

export interface TurnstileVerification {
  ok: boolean;
  /** `true` when Turnstile is not configured on this deployment at all. */
  skipped: boolean;
  codes: string[];
}

/**
 * Validates a widget token against the siteverify endpoint. `clientIp` is
 * forwarded for the optional strict-IP check configured in the dashboard.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  clientIp?: string
): Promise<TurnstileVerification> {
  const secret = trimmed("TURNSTILE_SECRET");
  if (!secret) {
    if (getTurnstileSiteKey()) {
      console.warn(
        "Turnstile: NEXT_PUBLIC_TURNSTILE_SITEKEY is set but TURNSTILE_SECRET is missing; verification is skipped."
      );
    }
    return { ok: true, skipped: true, codes: [] };
  }
  if (!token) {
    return { ok: false, skipped: false, codes: ["missing-input-response"] };
  }

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(clientIp ? { remoteip: clientIp } : {}) }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Turnstile siteverify request failed:", error);
    // A siteverify outage must not silently pass bots: fail closed.
    return { ok: false, skipped: false, codes: ["siteverify-unreachable"] };
  }

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; "error-codes"?: string[] }
    | null;
  if (!payload) {
    return { ok: false, skipped: false, codes: ["siteverify-bad-response"] };
  }
  return {
    ok: Boolean(payload.success),
    skipped: false,
    codes: payload["error-codes"] ?? [],
  };
}
