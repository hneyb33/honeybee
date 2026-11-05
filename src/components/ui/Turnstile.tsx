"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared Cloudflare Turnstile widget for login/register/onboarding.
 *
 * The sitekey is fetched from the deployment (`GET /api/security/turnstile`)
 * instead of being inlined from `process.env` at build time. A client bundle
 * freezes when the build runs, while the matching secret is a Worker secret set
 * afterwards - and when the two drifted, the checkbox silently disappeared while
 * the server still demanded a solved token, locking everyone out of admin.
 * Fetching keeps the widget and the verification on the same widget.
 *
 * Renders nothing (and immediately reports a `null` token) while Turnstile is
 * unconfigured, so local development and the pre-cutover dual-run keep their
 * current forms. Parents remount the widget via the React `key` prop after a
 * rejected attempt - Turnstile tokens are single-use, so every retry needs a
 * fresh solve.
 */

interface TurnstileWidget {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      appearance?: "always" | "auto" | "execute";
      callback: (token: string) => void;
      "error-execution"?: () => void;
      "expired-callback"?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
    __turnstileScriptPromise?: Promise<void>;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileScriptPromise) return window.__turnstileScriptPromise;
  window.__turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.appendChild(script);
  });
  return window.__turnstileScriptPromise;
}

interface TurnstileProps {
  /** Ties the solved token to this flow, matching the dashboard widget config. */
  action: "login" | "register" | "onboarding";
  onToken: (token: string | null) => void;
  className?: string;
}

export interface TurnstileConfig {
  /** `true` when the deployment holds a verification secret, so the check is enforced. */
  configured: boolean;
  sitekey: string | null;
}

type ConfigState = { status: "loading" } | ({ status: "ready" } & TurnstileConfig) | { status: "error" };

let cachedConfig: Promise<TurnstileConfig | null> | null = null;

/** One lookup per page load; a failure drops the cache so the next mount retries. */
function loadTurnstileConfig(): Promise<TurnstileConfig | null> {
  if (!cachedConfig) {
    cachedConfig = fetch("/api/security/turnstile", { cache: "no-store" })
      .then((response) =>
        response.ok ? (response.json() as Promise<TurnstileConfig>) : null
      )
      .catch(() => {
        cachedConfig = null;
        return null;
      });
  }
  return cachedConfig;
}

export function Turnstile({ action, onToken, className }: TurnstileProps) {
  const [config, setConfig] = useState<ConfigState>({ status: "loading" });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadTurnstileConfig().then((resolved) => {
      if (cancelled) return;
      setConfig(resolved ? { status: "ready", ...resolved } : { status: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = config.status === "ready";
  const configured = ready && config.configured;
  const siteKey = ready ? config.sitekey : null;

  useEffect(() => {
    if (config.status === "loading") return;
    if (!configured || !siteKey) {
      // Unconfigured deployment: the server-side check skips verification too.
      onToken(null);
      return;
    }
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "always",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-execution": () => {
            onToken(null);
            setLoadError("The human check could not run. Refresh and try again.");
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          onToken(null);
          setLoadError("The human check could not load. Check your connection and retry.");
        }
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Widget already gone; nothing to clean up.
        }
      }
    };
  }, [config.status, configured, siteKey, action, onToken]);

  if (config.status === "error") {
    return (
      <div className={className}>
        <p role="alert" className="text-sm text-destructive">
          The human check could not be reached. Refresh and try again.
        </p>
      </div>
    );
  }

  if (!configured) return null;

  // Enforced check, but the deployment gave no sitekey to solve it with: name
  // the dead end instead of leaving the form on an unsolvable requirement.
  if (!siteKey) {
    return (
      <div className={className}>
        <p role="alert" className="text-sm text-destructive">
          The human check is enabled but this deployment is missing its sitekey,
          so sign-in cannot complete. Configure NEXT_PUBLIC_TURNSTILE_SITEKEY.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} aria-label="Human verification" />
      {loadError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {loadError}
        </p>
      )}
    </div>
  );
}

/**
 * Exchanges a widget token for a server-side pass. Returns `true` when
 * Turnstile is unconfigured (the verification route reports `skipped`).
 */
export async function requestTurnstilePass(
  token: string | null,
  action: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/security/turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    // A failed verification request never unlocks a protected action.
    return false;
  }
}
