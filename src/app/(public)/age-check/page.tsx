"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readAgeDecision } from "@/lib/age-verification";

/**
 * Legacy standalone verification route. The site-wide AgeGate in the root
 * layout is now the single gate UI for every decision state, so this page
 * only has work to do for visitors who are already verified (mostly direct
 * URL hits and old links): send them home. Unverified and denied visitors
 * never see this page's body at all - the root gate overlay covers it.
 */
export default function AgeCheckPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (readAgeDecision() === "verified") {
      setVerified(true);
      router.replace("/");
    }
  }, [router]);

  if (!verified) return null;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">You are verified</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Taking you back in a moment&hellip;
        </p>
        <Button asChild className="mt-4 h-11 w-full rounded-xl bg-airbnb-coral font-semibold text-white hover:bg-[#AD3039]">
          <Link href="/">Continue to Honeybee</Link>
        </Button>
      </div>
    </div>
  );
}
