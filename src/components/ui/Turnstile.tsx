"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared Cloudflare Turnstile widget for login/register/onboarding.
 *
 * Renders nothing (and immediately reports a `null` token) when
 * `NEXT_PUBLIC_TURNSTILE_SITEKEY` is not configured, so local development and
 * the pre-cutover dual-run keep their current forms. Parents remount the
 * widget via the React `key` prop after a rejected attempt - Turnstile tokens
 * are single-use, so every retry needs a fresh solve.
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

export function Turnstile({ action, onToken, className }: TurnstileProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY?.trim() || null;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!siteKey) {
      // Unconfigured deployment: the server-side check skips too.
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
  }, [siteKey, action, onToken]);

  if (!siteKey) return null;

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

export function isTurnstileActive(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY?.trim());
}
