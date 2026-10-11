import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-7 w-7 text-airbnb-coral" /> Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: October 2026</p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-muted-foreground">
        <p>
          Honeybee (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the platform&rdquo;) is committed to protecting your privacy and confidential identity. This Privacy Policy details how we handle account data, identity verification documents, and communications in accordance with Uganda&apos;s Data Protection and Privacy Act.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">1. Identity Verification Documents</h3>
        <p>
          Government ID images (Ugandan National ID, NIN, Passport) and sensitive background checks submitted by providers are used strictly for manual accreditation and anti-fraud verification by authorized Honeybee administrators. They are stored securely and never published publicly, displayed to clients, or shared with third parties without legal process.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">2. Client Data &amp; Discretion</h3>
        <p>
          We do not expose client telephone numbers or exact residential locations to providers before formal booking confirmation. Messages initiated via WhatsApp and Telegram are end-to-end encrypted under the respective messaging networks.
        </p>

        <h3 className="text-base font-bold text-foreground pt-2">3. Cookies &amp; Age Gate</h3>
        <p>
          We use functional cookies to preserve your 18+ age verification consent, session authentication, and theme preferences.
        </p>
      </div>
    </div>
  );
}
