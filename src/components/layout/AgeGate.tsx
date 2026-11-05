"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, AlertCircle, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AGE_VERIFICATION_KEY,
  clearAgeDecision,
  markAgeDenied,
  markAgeVerified,
  readAgeDecision,
} from "@/lib/age-verification";

/**
 * Site-wide age gate, mounted in the root layout so it is the first screen
 * on every route and stays up across client-side navigation.
 *
 * Behavior contract:
 * - Gated DOM is never rendered until the visitor positively clicks "18+",
 *   so nothing is seen by a crawler or reachable by keyboard beforehand.
 * - "Under 18" locks the site on a humble reminder screen that persists
 *   across reloads and visits; it can only be left by re-confirming (which
 *   honestly re-shows the gate) or by exiting to a search engine.
 * - Decisions sync across open tabs via the `storage` event.
 */

type GateState = "checking" | "pending" | "denied" | "verified";

function stateFromDecision(decision: ReturnType<typeof readAgeDecision>): GateState {
  if (decision === "verified") return "verified";
  if (decision === "denied") return "denied";
  return "pending";
}

export function AgeGate({ children }: { children: ReactNode }) {
  // "checking" avoids a hydration mismatch: nothing gated renders until the
  // stored decision is read from localStorage on the client.
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    setState(stateFromDecision(readAgeDecision()));
  }, []);

  // Keep sibling tabs in step: verifying or denying in one tab applies
  // everywhere immediately, so a denial can't be sidestepped by an
  // already-open tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== AGE_VERIFICATION_KEY) return;
      setState(stateFromDecision(readAgeDecision()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (state === "verified") return <>{children}</>;

  const confirm = () => {
    markAgeVerified();
    setState("verified");
  };

  const deny = () => {
    markAgeDenied();
    setState("denied");
  };

  const reconfirm = () => {
    clearAgeDecision();
    setState("pending");
  };

  const exit = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4 py-10"
    >
      {state === "denied" ? (
        <GateShell>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Sprout className="h-8 w-8" />
          </div>
          <h1 id="age-gate-title" className="text-center text-2xl font-bold tracking-tight">
            Grow first, then come back
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            It looks like you are not 18 yet, and Honeybee is a space strictly for adults.
            There is nothing here for you just yet - and honestly, that is a good thing.
            The world you need right after this one is much kinder.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Take care of yourself, keep learning, and when you have grown the few years
            this place asks for, you will be welcome back.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              onClick={exit}
              className="h-12 w-full rounded-xl bg-neutral-900 font-semibold text-white shadow-md hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              Take me from here
            </Button>
            <button
              type="button"
              onClick={reconfirm}
              className="mx-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              I made a mistake - I am actually 18 or older
            </button>
          </div>
        </GateShell>
      ) : (
        <GateShell>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-airbnb-coral dark:bg-rose-950/40">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 id="age-gate-title" className="text-center text-2xl font-bold tracking-tight">
            Age Verification
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            You must be 18 years of age or older to enter Honeybee.
          </p>

          <div className="my-4 space-y-2.5 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
              <AlertCircle className="h-4 w-4 text-airbnb-coral" /> Platform Community Standards:
            </div>
            <p>• Only adults 18+ with legal capacity are permitted to browse or book.</p>
            <p>• Mutual respect, verified identity, and discretion are strictly required.</p>
            <p>• Prohibited solicitation or illegal exploitation results in immediate ban.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              onClick={confirm}
              disabled={state === "checking"}
              autoFocus
              className="h-12 w-full rounded-xl bg-airbnb-coral font-semibold text-white shadow-md hover:bg-[#AD3039]"
            >
              I am 18 or older — Enter Site
            </Button>
            <Button
              variant="ghost"
              onClick={deny}
              disabled={state === "checking"}
              className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
            >
              I am under 18
            </Button>
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            By entering you confirm this is true, and we keep your answer on this
            device only - nothing is uploaded.
          </p>
        </GateShell>
      )}
    </div>
  );
}

/** Shared card frame so the gate and the reminder screen stay visually identical. */
function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
      {children}
    </div>
  );
}
