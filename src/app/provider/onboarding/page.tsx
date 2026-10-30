"use client";

import Link from "next/link";
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
import { STEP_HINTS } from "./onboarding-config";
import { Stepper, InlineAlert } from "./onboarding-ui";
import { StepAbout, StepLocation, StepPortfolio, StepReview, StepServices } from "./steps";
import { useOnboarding } from "./use-onboarding";

const STEP_TITLES = [
  { model: "Set up your model profile", specialist: "Set up your service profile" },
  { model: "Where clients can find you", specialist: "Where clients can find you" },
  { model: "What experiences do you offer?", specialist: "What services do you provide?" },
  { model: "Tell your story and add photos", specialist: "Tell your story and add photos" },
  { model: "Review before submitting", specialist: "Review before submitting" },
];

export default function ProviderOnboardingPage() {
  const c = useOnboarding();
  const steps = c.steps;
  const stepTitle = (c.isModel ? STEP_TITLES[c.currentStep].model : STEP_TITLES[c.currentStep].specialist);

  if (c.loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-airbnb-coral" />
        <span className="ml-2 text-sm text-muted-foreground">Loading your saved profile...</span>
      </div>
    );
  }

  if (!c.accountKind) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p role="alert" className="text-sm text-destructive">
          {c.error || "Could not load your provider account."}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-airbnb-coral hover:underline">
          Sign in again
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
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Your Honeybee profile is in review</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Thanks, {c.form.title}. Your ad is saved but won&apos;t appear in discovery until a moderator verifies
            it. You can return to onboarding to update it while it is awaiting review. Once it is approved, you can
            pay to feature it.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/provider/onboarding">
              <Button variant="outline" className="w-full rounded-xl">Edit profile</Button>
            </Link>
            {c.accountKind === "agency" && (
              <Button
                onClick={c.startOver}
                className="w-full rounded-xl bg-[#d3444d] font-bold text-white hover:bg-[#ad3039]"
              >
                Post another ad
              </Button>
            )}
            <Link href="/">
              <Button className="w-full rounded-xl bg-airbnb-coral font-bold text-white">Explore Honeybee</Button>
            </Link>
            {c.listingId && (
              <Link href={`/subscribe?listing_id=${encodeURIComponent(c.listingId)}#advertising-card`}>
                <Button className="w-full rounded-xl bg-[#d3444d] font-bold text-white hover:bg-[#ad3039]">
                  Choose ad feature
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {c.isModel ? "Model onboarding" : "Service provider onboarding"}
      </p>
      <Stepper steps={steps} currentStep={c.currentStep} onJumpTo={c.goToStep} disabled={c.saving} />

      <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
        <CardHeader className="bg-gradient-to-br from-rose-50 via-white to-amber-50 pb-5 dark:from-neutral-900 dark:via-card dark:to-neutral-900">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Step {c.currentStep + 1}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">{steps[c.currentStep]}</span>
          </div>
          <CardTitle className="mt-2 text-2xl font-extrabold tracking-tight">{stepTitle}</CardTitle>
          <CardDescription className="text-sm">{STEP_HINTS[c.currentStep]}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-7">
          {c.error && <InlineAlert>{c.error}</InlineAlert>}

          {c.currentStep === 0 && <StepAbout c={c} />}
          {c.currentStep === 1 && <StepLocation c={c} />}
          {c.currentStep === 2 && <StepServices c={c} />}
          {c.currentStep === 3 && <StepPortfolio c={c} />}
          {c.currentStep === 4 && <StepReview c={c} />}

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
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : c.queue.hasActiveUploads ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : c.currentStep === 4 ? (
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
            Your progress is saved as you continue. You can return to edit an unverified profile.
          </p>
        </CardContent>
      </Card>

      <div className="mt-5 flex justify-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit onboarding
        </Link>
      </div>
    </div>
  );
}
