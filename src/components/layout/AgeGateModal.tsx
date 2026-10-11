"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("honeybee_age_verified");
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirmAge = () => {
    localStorage.setItem("honeybee_age_verified", "true");
    setIsOpen(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-6 sm:p-8 rounded-3xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-airbnb-coral dark:bg-rose-950/40">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">Age Verification</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            You must be 18 years of age or older to enter Honeybee.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-2.5 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-airbnb-coral" /> Platform Community Standards:
          </div>
          <p>• Only adults 18+ with legal capacity are permitted to browse or book.</p>
          <p>• Mutual respect, verified identity, and discretion are strictly required.</p>
          <p>• Prohibited solicitation or illegal exploitation results in immediate ban.</p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={handleConfirmAge}
            className="w-full h-12 rounded-xl bg-airbnb-coral text-white font-semibold hover:bg-[#AD3039] shadow-md"
          >
            I am 18 or older — Enter Site
          </Button>
          <Button
            variant="ghost"
            onClick={handleExit}
            className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Exit (I am under 18)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
