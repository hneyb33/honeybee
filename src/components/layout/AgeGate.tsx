"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VERIFICATION_KEY = "honeybee_age_verified";

/**
 * Wraps the site so age-gated content is not merely dimmed behind a modal but is
 * genuinely withheld until the visitor confirms they are 18+. The gated DOM is
 * never rendered while the gate is up, so it is neither seen by a crawler nor
 * reachable by keyboard before confirmation.
 */
export function AgeGate({ children }: { children: ReactNode }) {
  // "checking" avoids a hydration mismatch: nothing gated renders until the
  // stored decision is read from localStorage on the client.
  const [state, setState] = useState<"checking" | "pending" | "verified">("checking");

  useEffect(() => {
    try {
      setState(localStorage.getItem(VERIFICATION_KEY) === "true" ? "verified" : "pending");
    } catch {
      // Private-mode storage failures default to showing the gate again.
      setState("pending");
    }
  }, []);

  if (state === "verified") return <>{children}</>;

  const confirm = () => {
    try {
      localStorage.setItem(VERIFICATION_KEY, "true");
    } catch {
      // Ignore: the confirmation simply will not persist next visit.
    }
    setState("verified");
  };

  const exit = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-airbnb-coral dark:bg-rose-950/40">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight">Age Verification</h1>
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
            className="h-12 w-full rounded-xl bg-airbnb-coral font-semibold text-white shadow-md hover:bg-[#AD3039]"
          >
            I am 18 or older — Enter Site
          </Button>
          <Button
            variant="ghost"
            onClick={exit}
            className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
          >
            Exit (I am under 18)
          </Button>
        </div>
      </div>
    </div>
  );
}
