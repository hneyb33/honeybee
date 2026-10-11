"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Check, Shield, Zap, Sparkles } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SubscribePage() {
  const [period, setPeriod] = useState<"daily" | "monthly">("monthly");
  const [listingId, setListingId] = useState("");

  useEffect(() => {
    setListingId(new URLSearchParams(window.location.search).get("listing_id") ?? "");
  }, []);

  const plans = [
    {
      id: "client_basic",
      name: "Client Basic",
      description: "Access verified specialist listings and request appointments.",
      dailyPrice: 2000,
      monthlyPrice: 18500,
      badge: "Popular",
      features: [
        "Browse verified specialist directory",
        "Direct appointment booking requests",
        "Community reviews & ratings",
        "Standard customer support",
      ],
      role: "client",
    },
    {
      id: "client_premium",
      name: "Client VIP Access",
      description: "Unlock exclusive VIP companion profiles and direct messaging.",
      dailyPrice: 10000,
      monthlyPrice: 50000,
      badge: "VIP Exclusive",
      popular: true,
      features: [
        "Full access to VIP companion profiles",
        "Direct WhatsApp & Telegram contact",
        "Priority response SLA",
        "Zero booking platform surcharge",
        "Dedicated VIP support agent",
      ],
      role: "client",
    },
    {
      id: "specialist",
      name: "Specialist Provider",
      description: "List your private chef, laundry, or home wellness service.",
      dailyPrice: 20000,
      monthlyPrice: 100000,
      badge: "For Professionals",
      features: [
        "Verified provider business profile",
        "Showcase unlimited service packages",
        "GPS suburb radius matching",
        "Direct client job requests",
        "Operations management dashboard",
      ],
      role: "provider",
    },
    {
      id: "escort_vip",
      name: "VIP Talent Listing",
      description: "Elite verified companion profile with maximum visibility.",
      dailyPrice: 25000,
      monthlyPrice: 120000,
      badge: "Top Placement",
      features: [
        "Featured top placement in discovery",
        "Exclusive VIP profile gold badge",
        "High-definition video reel showcase",
        "Direct encrypted client inquiries",
        "Priority profile verification queue",
      ],
      role: "provider",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="vip" className="px-3 py-1 text-xs">
          <Crown className="h-3.5 w-3.5 mr-1" /> Membership &amp; Listing Plans
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {listingId ? "Feature your profile" : "Elevate your Honeybee experience"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {listingId
            ? "Choose VIP placement for this ad. Your payment and profile will be reviewed before enhanced placement is activated."
            : "Transparent, secure pricing for clients seeking VIP access and verified specialists growing their business in Uganda."}
        </p>

        {/* Period Switcher */}
        <div className="mt-8 inline-flex items-center rounded-full border border-border bg-muted p-1">
          <button
            onClick={() => setPeriod("daily")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              period === "daily"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daily Pass
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              period === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Membership{" "}
            <span className="ml-1 text-[10px] text-emerald-600 font-bold">
              Save 35%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className={`mt-12 grid grid-cols-1 gap-6 ${listingId ? "mx-auto max-w-md" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {plans.filter((plan) => !listingId || plan.id === "escort_vip").map((plan) => {
          const price = period === "daily" ? plan.dailyPrice : plan.monthlyPrice;
          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between rounded-3xl transition-all hover:shadow-lg ${
                plan.popular
                  ? "border-2 border-airbnb-coral shadow-md relative"
                  : "border-border"
              }`}
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant={plan.popular ? "vip" : "secondary"}>
                    {plan.badge}
                  </Badge>
                  {plan.popular && (
                    <span className="flex items-center gap-1 text-xs font-bold text-airbnb-coral">
                      <Sparkles className="h-3 w-3" /> Best Choice
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl font-bold mt-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  {plan.description}
                </CardDescription>

                {/* Price Display */}
                <div className="pt-4">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {formatUGX(price)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    /{period === "daily" ? "day" : "month"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                {/* Features List */}
                <ul className="space-y-2.5 my-4 text-xs text-muted-foreground">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Checkout CTA */}
                <Link
                  href={`/payments/new?plan=${plan.id}&period=${period}&amount=${price}${listingId ? `&listing_id=${encodeURIComponent(listingId)}` : ""}`}
                  className="w-full mt-4"
                >
                  <Button
                    className={`w-full rounded-2xl h-11 text-xs font-bold ${
                      plan.popular
                        ? "bg-airbnb-coral text-white hover:bg-[#AD3039]"
                        : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                    }`}
                  >
                    Select Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security note */}
      <div className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>
          Payment verified securely via MTN Mobile Money &amp; Airtel Money merchant code.
        </span>
      </div>
    </div>
  );
}
