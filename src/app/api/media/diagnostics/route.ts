import { NextResponse } from "next/server";
import {
  destroyCloudinaryAsset,
  getCloudinaryConfig,
  getCloudinaryUploadParams,
  inspectCloudinaryEnvironment,
  signCloudinaryParams,
} from "@/lib/cloudinary";
import { extractCloudinaryMessage } from "@/lib/media-errors";
import { getAuthenticatedRequestClient } from "@/lib/supabase/authenticated-request";

export const dynamic = "force-dynamic";

/** A 1x1 PNG so the test upload always fits inside any account's size limit. */
const TEST_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface StepResult<T> {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
  cldError?: string | null;
}

async function cloudinaryGet(
  path: string,
  config: { apiKey: string; apiSecret: string }
): Promise<StepResult<unknown>> {
  try {
    const response = await fetch(path, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
      },
      cache: "no-store",
    });
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      data: payload ?? text.slice(0, 400),
      error: response.ok
        ? undefined
        : extractCloudinaryMessage(payload) ?? `HTTP ${response.status}`,
      cldError: response.headers.get("x-cld-error"),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Network failure" };
  }
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedRequestClient(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: actor } = await auth.client
    .from("profiles")
    .select("role")
    .eq("id", auth.userId)
    .maybeSingle();
  if (!actor || !["super_admin", "moderator"].includes(actor.role)) {
    return NextResponse.json(
      { error: "Admin access is required to run media diagnostics." },
      { status: 403 }
    );
  }

  const environment = inspectCloudinaryEnvironment();
  const config = getCloudinaryConfig();
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    environment,
  };

  if (!config) {
    return NextResponse.json(
      {
        ...report,
        verdict: "Cloudinary credentials are not available to this deployment.",
        recommendations: environment.warnings.length
          ? environment.warnings
          : ["Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, then redeploy."],
      },
      { status: 200 }
    );
  }

  const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}`;

  // 1. Does the account answer, and on which plan?
  report.ping = await cloudinaryGet(`${base}/ping`, config);

  // 2. Are we inside the plan's storage, bandwidth and transformation limits?
  report.usage = await cloudinaryGet(`${base}/usage?last_days=1`, config);

  // 3. Exercise the exact production upload path: same signing code, same
  //    allowed_formats, same eager configuration, tiny file.
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `honeybee/_diagnostics/${crypto.randomUUID()}`;
  const params = getCloudinaryUploadParams("image", timestamp, publicId);
  const body = new URLSearchParams({
    file: TEST_PIXEL,
    api_key: config.apiKey,
    timestamp: String(timestamp),
    signature: signCloudinaryParams(params, config.apiSecret),
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ),
  });

  let uploadResult: StepResult<{ public_id?: string; bytes?: number; format?: string }>;
  try {
    const response = await fetch(`${base}/image/upload`, {
      method: "POST",
      body,
      cache: "no-store",
    });
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    uploadResult = {
      ok: response.ok,
      status: response.status,
      data: response.ok ? (payload as { public_id?: string; bytes?: number; format?: string }) : undefined,
      error: response.ok
        ? undefined
        : extractCloudinaryMessage(payload) ??
          (payload === null ? `Non-JSON response: ${text.slice(0, 200)}` : `HTTP ${response.status}`),
      cldError: (() => {
        try {
          return response.headers.get("x-cld-error");
        } catch {
          return null;
        }
      })(),
    };
  } catch (error) {
    uploadResult = {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach Cloudinary from the server.",
    };
  }
  report.uploadTest = uploadResult;

  // 4. Clean up the probe asset so diagnostics never leave residue.
  if (uploadResult.ok) {
    report.cleanup = {
      ok: await destroyCloudinaryAsset(config, "image", publicId),
      publicId,
    };
  }

  const recommendations: string[] = [...environment.warnings];
  if (!uploadResult.ok) {
    const reason = `${uploadResult.error ?? ""} ${uploadResult.cldError ?? ""}`.toLowerCase();
    if (reason.includes("signature")) {
      recommendations.push(
        "Cloudinary does not accept signatures produced with this API secret. Confirm CLOUDINARY_API_SECRET belongs to the same account as CLOUDINARY_API_KEY and that neither is quoted in Vercel."
      );
    }
    if (reason.includes("api key") || reason.includes("unknown api key")) {
      recommendations.push("CLOUDINARY_API_KEY is not recognised for this cloud name.");
    }
    if (reason.includes("size") || reason.includes("too large")) {
      recommendations.push(
        "The account's maximum upload size is below what Honeybee allows. Raise it in Console -> Settings -> Account -> Usage limits, or lower the caps in src/lib/media-policy.ts."
      );
    }
    if (reason.includes("format")) {
      recommendations.push(
        "The account restricts formats. Check Console -> Settings -> Upload -> Restricted media types and allowed formats."
      );
    }
    if (reason.includes("not allowed") || reason.includes("disabled") || reason.includes("unauthorized")) {
      recommendations.push(
        "The account or API key is blocked from uploads. Verify the cloud is active, that unsigned/signed uploads are enabled, and that usage limits have not been reached."
      );
    }
    if (uploadResult.status === 404) {
      recommendations.push("CLOUDINARY_CLOUD_NAME does not match an existing cloud.");
    }
    if (uploadResult.status === 420 || uploadResult.status === 429) {
      recommendations.push("The account is rate limited. Reduce concurrency or wait before retrying.");
    }
  }

  return NextResponse.json(
    {
      ...report,
      verdict: uploadResult.ok
        ? "Cloudinary accepted a signed upload from this deployment. If provider uploads still fail, the cause is per-file (size, duration, format) or browser-side (VPN, extension, network)."
        : "Cloudinary refused a signed upload from this deployment. The provider upload path cannot work until this succeeds.",
      recommendations,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
