import React from "react";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-7 w-7 text-airbnb-coral" /> Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: October 2026</p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-muted-foreground">
        <p>
          Welcome to Honeybee. By accessing, browsing, or listing on our platform, you agree to comply with the following Terms and Conditions.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">1. Eligibility (Strict 18+ Rule)</h3>
        <p>
          You must be at least 18 years of age to access Honeybee. Any attempt by a minor to register or communicate will result in immediate permanent termination and reporting where required.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">2. Independent Service Providers</h3>
        <p>
          Providers listed on Honeybee (including culinary chefs, domestic specialists, wellness therapists, and companions) are independent entities. Honeybee facilitates verified discovery, escrow, and reputation scoring.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">3. Subscription &amp; Payments</h3>
        <p>
          Listing and VIP membership fees are charged in Ugandan Shillings (UGX). All Mobile Money transactions are verified against the telecom transaction reference code before plan activation.
        </p>
      </div>
    </div>
  );
}
