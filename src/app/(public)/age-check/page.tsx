"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AgeCheckPage() {
  const router = useRouter();

  const handleConfirm = () => {
    localStorage.setItem("honeybee_age_verified", "true");
    router.push("/");
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full rounded-3xl border-border shadow-2xl p-6 sm:p-8">
        <CardHeader className="text-center p-0 pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-airbnb-coral dark:bg-rose-950/40">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            You must be 18 or older to continue
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            This platform contains verified adult entertainment &amp; private companion listings.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <div className="rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 space-y-2 border border-border">
            <h4 className="font-bold text-foreground">Rules &amp; Guidelines:</h4>
            <p>1. You must be 18 years of age or older to enter or book.</p>
            <p>2. Respectful, consensual interaction is mandatory across all channels.</p>
            <p>3. Zero tolerance for illegal solicitation, fraud, or unverified hosts.</p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              onClick={handleConfirm}
              className="w-full h-12 rounded-xl bg-airbnb-coral text-white font-bold hover:bg-[#E00B41] shadow-md"
            >
              Yes, I am 18+ and Accept the Rules
            </Button>
            <Button
              variant="outline"
              onClick={handleExit}
              className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground"
            >
              No, leave site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
