/**
 * Client-safe error translation for the media pipeline.
 *
 * Lives on its own because `@/lib/cloudinary` pulls in `node:crypto` and can
 * never be imported from a browser component, yet the browser is exactly where
 * these messages have to be rendered.
 */

export function isHtmlResponse(contentType: string | null | undefined): boolean {
  return Boolean(contentType && contentType.toLowerCase().includes("text/html"));
}

export interface UploadFailureInput {
  status: number;
  statusText?: string;
  contentType?: string | null;
  cloudinaryMessage?: string | null;
  cldErrorHeader?: string | null;
  bodySnippet?: string | null;
}

export interface DescribedFailure {
  message: string;
  detail: string;
}

/**
 * Normalises a Cloudinary or edge-proxy failure into something a provider can
 * act on. Cloudinary answers with JSON; proxies, firewalls and VPNs answer with
 * HTML. Previously every non-JSON body was reported as "Cloudinary request
 * failed", which pointed users at the wrong service entirely.
 */
export function describeCloudinaryFailure(input: UploadFailureInput): DescribedFailure {
  const detail = [
    `status: ${input.status}${input.statusText ? ` ${input.statusText}` : ""}`,
    input.cldErrorHeader ? `x-cld-error: ${input.cldErrorHeader}` : null,
    input.cloudinaryMessage ? `cloudinary: ${input.cloudinaryMessage}` : null,
    input.bodySnippet ? `body: ${input.bodySnippet}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const reason = input.cloudinaryMessage ?? input.cldErrorHeader ?? null;

  if (isHtmlResponse(input.contentType)) {
    return {
      message: `The upload was blocked before it reached Cloudinary (HTTP ${input.status}). A firewall, VPN or browser extension is usually the cause rather than the file itself.`,
      detail,
    };
  }

  switch (true) {
    case input.status === 401:
      return {
        message: reason
          ? `Cloudinary rejected the upload authorization: ${reason}`
          : "Cloudinary rejected the upload authorization. Check the API key and API secret configured for this deployment.",
        detail,
      };
    case input.status === 403:
      return {
        message: reason
          ? `Cloudinary is not allowing uploads: ${reason}`
          : "Cloudinary refused the upload (HTTP 403). Verify the account's security settings and that uploads are enabled.",
        detail,
      };
    case input.status === 413:
      return {
        message: "Cloudinary rejected the file because it is larger than a single upload request allows. Use a smaller photo or a shorter clip.",
        detail,
      };
    case input.status === 420 || input.status === 429:
      return {
        message: "Cloudinary is rate limiting this account. Wait a minute and try again.",
        detail,
      };
    case input.status >= 500:
      return {
        message: "Cloudinary had a server problem processing the upload. Try again in a moment.",
        detail,
      };
    case Boolean(reason):
      return { message: `Cloudinary could not accept the file: ${reason}`, detail };
    default:
      return {
        message: `Cloudinary could not accept the file (HTTP ${input.status}).`,
        detail,
      };
  }
}

export function extractCloudinaryMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (!("error" in payload)) return null;
  const error = payload.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return null;
}

/** Error carrying the technical detail alongside the user-facing message. */
export class MediaUploadError extends Error {
  readonly detail: string;
  readonly status: number | null;
  /** Whether re-sending the same bytes could plausibly succeed. */
  readonly retryable: boolean;

  constructor(
    message: string,
    options?: { detail?: string; status?: number | null; retryable?: boolean }
  ) {
    super(message);
    this.name = "MediaUploadError";
    this.detail = options?.detail ?? "";
    this.status = options?.status ?? null;
    this.retryable = options?.retryable ?? false;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException ? error.name === "AbortError" : error instanceof Error && error.name === "AbortError";
}
