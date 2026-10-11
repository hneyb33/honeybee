"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatUGX } from "@/lib/utils";
import {
  Smartphone,
  CheckCircle,
  Clock,
  Upload,
  Shield,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get("plan") || "client_premium";
  const period = searchParams.get("period") || "monthly";
  const amount = Number(searchParams.get("amount") || 50000);

  const [provider, setProvider] = useState<"mtn" | "airtel">("mtn");
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            Complete Subscription
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
                {plan.replace("_", " ")} ({period})
              </h4>
            </div>
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
                Our automated verification or administrator will approve your subscription within 5–15 minutes.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button className="rounded-full bg-airbnb-coral text-white hover:bg-[#E00B41]">
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

              {/* Receipt File Upload (Optional) */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Upload Screenshot / Receipt (Optional)
                </label>
                <div className="mt-1.5 flex justify-center rounded-2xl border border-dashed border-border px-6 py-4 hover:border-foreground/50 transition-colors cursor-pointer">
                  <div className="text-center text-xs text-muted-foreground">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                    <span>Click or drag image screenshot</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-airbnb-coral text-white font-bold hover:bg-[#E00B41] shadow-md"
              >
                Submit Payment for Approval
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

