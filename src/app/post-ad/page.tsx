"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AD_STEP_HINTS, type AdTypeOption } from "./ad-config";
import { Stepper } from "@/app/provider/onboarding/onboarding-ui";
import {
  AdTypeChooser,
  StepContent,
  StepLocationContact,
  StepMedia,
  StepReview,
} from "./ad-steps";
import { useAd } from "./use-ad";
import type { AdType } from "@/lib/supabase/types";

const STEP_TITLES = ["Your ad", "Photos & video", "Location & contact", "Duration & review"];

function parseAdType(value: string | null): AdType | null {
  return value === "fast" || value === "independent" || value === "agency" ? value : null;
}

/**
 * Gateway into the Post Ad wizard. The ad type arrives via `?type=` from the
 * /advertise cards; when it is missing we show the Fast / Independent / Agency
 * chooser first. Kept as a pure shell so `useAd` only mounts once a type is set.
 */
function PostAdContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = parseAdType(searchParams.get("type"));

  if (!type) {
    return (
      <AdTypeChooser
        selected={null}
        onPick={(option: AdTypeOption) => router.push(`/post-ad?type=${option.id}`)}
      />
    );
  }

  return <AdWizard key={type} type={type} />;
}

function AdWizard({ type }: { type: AdType }) {
  const c = useAd(type);
  const option = c.option;

  if (c.loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-airbnb-coral" />
        <span className="ml-2 text-sm text-muted-foreground">Preparing your ad…</span>
      </div>
    );
  }

  if (!c.userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Sign in to post an ad on Honeybee.</p>
        <Link href={`/login?next=${encodeURIComponent(`/post-ad?type=${type}`)}`} className="mt-4 inline-block text-sm font-semibold text-airbnb-coral hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (c.submitted) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-12">
        <Card className="w-full rounded-3xl p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <Badge variant="secondary" className="mt-5">Submitted for review</Badge>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Your ad is in review</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Thanks! “{c.form.title || option.label}” is saved as pending. A moderator will review it and,
            once published, it can appear in the featured ad spaces. You will settle the {option.label.toLowerCase()}{" "}
            price after it is approved.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={c.startOver}
              variant="outline"
              className="w-full rounded-xl"
            >
              Post another ad
            </Button>
            <Link href="/">
              <Button className="w-full rounded-xl bg-airbnb-coral font-bold text-white">Explore Honeybee</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isLast = c.currentStep === c.steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Post an ad · {option.label}
      </p>
      <Stepper steps={c.steps} currentStep={c.currentStep} onJumpTo={c.goToStep} disabled={c.saving} />

      <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
        <CardHeader className="bg-gradient-to-br from-rose-50 via-white to-amber-50 pb-5 dark:from-neutral-900 dark:via-card dark:to-neutral-900">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Step {c.currentStep + 1}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">{STEP_TITLES[c.currentStep]}</span>
          </div>
          <CardTitle className="mt-2 text-2xl font-extrabold tracking-tight">{c.steps[c.currentStep]}</CardTitle>
          <CardDescription className="text-sm">{AD_STEP_HINTS[c.currentStep]}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-7">
          {c.currentStep === 0 && <StepContent c={c} />}
          {c.currentStep === 1 && <StepMedia c={c} />}
          {c.currentStep === 2 && <StepLocationContact c={c} />}
          {c.currentStep === 3 && <StepReview c={c} />}

          {!isLast && c.error && (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {c.error}
            </p>
          )}

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={c.saving || c.currentStep === 0}
              onClick={c.prevStep}
              className="rounded-xl"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              disabled={c.saving || c.queue.hasActiveUploads}
              onClick={() => void c.nextStep()}
              className="rounded-xl bg-airbnb-coral font-bold text-white hover:bg-[#AD3039]"
            >
              {c.saving ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : c.queue.hasActiveUploads ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : isLast ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submit for review
                </>
              ) : (
                <>
                  Save &amp; continue <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Your progress is saved as you continue. The ad stays private until a moderator publishes it.
          </p>
        </CardContent>
      </Card>

      <div className="mt-5 flex justify-center">
        <Link href="/advertise" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to advertise
        </Link>
      </div>
    </div>
  );
}

export default function PostAdPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
          <LoaderCircle className="h-6 w-6 animate-spin text-airbnb-coral" />
        </div>
      }
    >
      <PostAdContent />
    </Suspense>
  );
}
