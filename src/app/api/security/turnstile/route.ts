import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyTurnstileToken } from "@/lib/turnstile";

/**
 * Pre-flight human check for the public entry points (login, register,
 * provider onboarding). The browser solves the Turnstile widget, this route
 * validates the token with Cloudflare, and the page only proceeds to the real
 * Supabase call once the pass comes back.
 *
 * Fail-closed whenever Turnstile is configured: an invalid, expired or missing
 * token is a 400 with copy safe to show directly. When it is not configured at
 * all (local development, pre-cutover deployments) the check reports
 * `skipped` and passes, mirroring the media provider getters.
 */

const requestSchema = z.object({
  token: z.string().max(2048).nullish(),
  action: z.string().max(64).optional(),
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
    return NextResponse.json({ error: "Malformed verification request." }, { status: 400 });
  }

  const clientIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;
  const result = await verifyTurnstileToken(parsed.data.token, clientIp);

  if (!result.ok) {
    console.warn(`Turnstile verification failed (action=${parsed.data.action ?? "none"}): ${result.codes.join(",")}`);
    return NextResponse.json(
      { error: "Please complete the human check and try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ passed: true, skipped: result.skipped });
}
