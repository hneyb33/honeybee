"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatUGX } from "@/lib/utils";
import {
  Smartphone,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

const PLAN_PRICES: Record<string, { daily: number; monthly: number }> = {
  client_basic: { daily: 2000, monthly: 18500 },
  client_premium: { daily: 10000, monthly: 50000 },
  specialist: { daily: 20000, monthly: 100000 },
  escort_vip: { daily: 25000, monthly: 120000 },
};

function PaymentContent() {
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan") || "";
  const requestedPeriod = searchParams.get("period");
  const period = requestedPeriod === "daily" ? "daily" : "monthly";
  const listingId = searchParams.get("listing_id");
  const amount = PLAN_PRICES[plan]?.[period] ?? 0;
  const planError = amount === 0 || (requestedPeriod !== "daily" && requestedPeriod !== "monthly")
    ? "This payment plan is invalid or incomplete."
    : listingId && plan !== "escort_vip"
      ? "Choose the VIP placement plan to feature this ad."
      : "";

  const [provider, setProvider] = useState<"mtn" | "airtel">("mtn");
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!supabase) {
      setError("Payments are unavailable until Supabase is configured.");
      return;
    }
    if (planError) {
      setError(planError);
      return;
    }

    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setSubmitting(false);
      setError(authError?.message ?? "Sign in before submitting a payment.");
      return;
    }

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: authData.user.id,
      listing_id: listingId,
      plan,
      period,
      provider: provider === "mtn" ? "mtn_momo" : "airtel_money",
      amount,
      payer_phone: payerPhone.trim(),
      transaction_id: transactionId.trim(),
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card className="rounded-3xl border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <Badge variant="vip" className="mx-auto mb-2 text-xs">
            Direct Merchant Payment
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {listingId ? "Submit ad feature payment" : "Complete Subscription"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Follow the prompt to pay via MTN MoMo or Airtel Money, then enter your transaction ID.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Plan Selected
              </p>
              <h4 className="text-base font-bold text-foreground capitalize">
                {listingId ? "Featured ad placement" : plan.replace("_", " ")} ({period})
              </h4>
            </div>
            {planError && !submitted && <p role="alert" className="text-sm text-destructive">{planError}</p>}
            <div className="text-right">
              <span className="text-xl font-extrabold text-airbnb-coral">
                {formatUGX(amount)}
              </span>
            </div>
          </div>

          {submitted ? (
            /* Submission Success Screen */
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Payment Submitted for Verification
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Thank you! Your transaction ID{" "}
                <strong className="text-foreground">{transactionId}</strong> has been logged.
                It has been sent to Honeybee for manual verification. Your {listingId ? "ad feature" : "subscription"} is not active until an administrator approves the payment.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button className="rounded-full bg-airbnb-coral text-white hover:bg-[#AD3039]">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="rounded-full">
                    Return to Explore
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Mobile Money Instructions & Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Select Mobile Money Gateway
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider("mtn")}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      provider === "mtn"
                        ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-bold text-sm text-foreground">MTN MoMo</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Dial *165*3# &gt; Merchant
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider("airtel")}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      provider === "airtel"
                        ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-bold text-sm text-foreground">Airtel Money</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Dial *185*9# &gt; Merchant
                    </div>
                  </button>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> Transfer Instructions:
                </p>
                <p>
                  1. Transfer <strong>{formatUGX(amount)}</strong> to Honeybee Merchant Code:{" "}
                  <strong>600492</strong> (Name: <strong>Honeybee Services</strong>).
                </p>
                <p>
                  2. Wait for SMS confirmation from {provider === "mtn" ? "MTN MoMo" : "Airtel Money"}.
                </p>
                <p>3. Enter your payer phone and Transaction ID below.</p>
              </div>

              {/* Payer Phone */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Your Phone Number (Sending Account)
                </label>
                <Input
                  required
                  placeholder="e.g. 0770 123 456"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Transaction / Reference ID
                </label>
                <Input
                  required
                  placeholder="e.g. 1984729184"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error} {error.includes("Sign in") && <Link href={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="font-semibold underline">Sign in</Link>}
                </p>
              )}
              <Button
                type="submit"
                disabled={submitting || !amount || Boolean(planError)}
                className="w-full h-12 rounded-2xl bg-airbnb-coral text-white font-bold hover:bg-[#AD3039] shadow-md"
              >
                {submitting ? "Submitting payment..." : "Submit Payment for Verification"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Loading payment details...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
