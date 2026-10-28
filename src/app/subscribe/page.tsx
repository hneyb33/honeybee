"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { formatUGX } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  audience: string;
  description: string;
  price: number;
  features: string[];
  icon: typeof Crown;
  accent: string;
  popular?: boolean;
  requiresListing?: boolean;
};

const plans: Plan[] = [
  {
    id: "client_premium",
    name: "Client VIP Access",
    audience: "For clients",
    description: "More confidence and access when finding the right connection.",
    price: 35_000,
    features: [
      "Access to VIP model profiles",
      "Direct contact options shown on profiles",
      "Priority support for your membership",
    ],
    icon: HeartHandshake,
    accent: "rose",
    popular: true,
  },
  {
    id: "escort_vip",
    name: "VIP Models",
    audience: "For models",
    description: "A higher-visibility membership for verified model profiles.",
    price: 80_000,
    features: [
      "VIP profile membership",
      "Priority position in discovery",
      "VIP badge after verification",
    ],
    icon: Crown,
    accent: "amber",
  },
  {
    id: "specialist",
    name: "Service Providers",
    audience: "For specialists",
    description: "Present your independent services to people nearby.",
    price: 50_000,
    features: [
      "Verified service-provider profile",
      "Showcase service offerings and rates",
      "Receive local client enquiries",
    ],
    icon: UsersRound,
    accent: "emerald",
  },
  {
    id: "escort_premium",
    name: "Premium Model",
    audience: "For models",
    description: "A practical monthly upgrade for a verified model profile.",
    price: 50_000,
    features: [
      "Premium profile placement",
      "Premium badge after verification",
      "Stand out in relevant discovery",
    ],
    icon: UserRound,
    accent: "violet",
  },
  {
    id: "advertiser_premium",
    name: "Advertising",
    audience: "For profile owners",
    description: "Promote one of your existing listings in featured placements.",
    price: 50_000,
    features: [
      "Admin-approved featured ad placement",
      "Featured carousel and reserved ad space",
      "One-month campaign on the selected listing",
    ],
    icon: Megaphone,
    accent: "sky",
    requiresListing: true,
  },
];

const accentStyles: Record<string, { icon: string; border: string; badge: string }> = {
  rose: {
    icon: "bg-rose-500/10 text-rose-300",
    border: "border-rose-400/60 shadow-rose-950/30",
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  },
  amber: {
    icon: "bg-amber-400/10 text-amber-300",
    border: "border-amber-300/30",
    badge: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  },
  emerald: {
    icon: "bg-emerald-400/10 text-emerald-300",
    border: "border-emerald-300/30",
    badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  },
  violet: {
    icon: "bg-violet-400/10 text-violet-300",
    border: "border-violet-300/30",
    badge: "border-violet-300/20 bg-violet-300/10 text-violet-200",
  },
  sky: {
    icon: "bg-sky-400/10 text-sky-300",
    border: "border-sky-300/30",
    badge: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  },
};

type OwnedListing = { id: string; title: string; kind: string; verification_status: string };

function SubscribeContent() {
  const searchParams = useSearchParams();
  const requestedListingId = searchParams.get("listing_id") ?? "";
  const [planPrices, setPlanPrices] = useState<Record<string, number>>(
    Object.fromEntries(plans.map((plan) => [plan.id, plan.price]))
  );
  const [activePlans, setActivePlans] = useState<Set<string>>(new Set(plans.map((plan) => plan.id)));
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState("");
  const [listings, setListings] = useState<OwnedListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState(requestedListingId);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setPricingError("Subscription pricing is unavailable until Supabase is configured.");
      setPricingLoading(false);
      setActivePlans(new Set());
      return;
    }
    let cancelled = false;

    const loadPlanPrices = async () => {
      const { data, error } = await client
        .from("subscription_plan_prices")
        .select("plan,amount,currency,is_active");
      if (cancelled) return;
      if (error) {
        setPricingError(error.message);
        setPricingLoading(false);
        setActivePlans(new Set());
        return;
      }

      const nextPrices: Record<string, number> = {};
      const nextActivePlans = new Set<string>();
      for (const row of data ?? []) {
        if (row.currency === "UGX" && Number.isSafeInteger(row.amount) && row.amount > 0) {
          nextPrices[row.plan] = row.amount;
          if (row.is_active) nextActivePlans.add(row.plan);
        }
      }
      setPlanPrices(nextPrices);
      setActivePlans(nextActivePlans);
      setPricingError("");
      setPricingLoading(false);
    };

    void loadPlanPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedListingId(requestedListingId);
  }, [requestedListingId]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const loadOwnedListings = async () => {
      setListingsLoading(true);
      const { data: authData, error: authError } = await supabase!.auth.getUser();
      if (authError) {
        if (!cancelled) setListingsError(authError.message);
        setListingsLoading(false);
        return;
      }
      if (!authData.user) {
        setListingsLoading(false);
        return;
      }

      const { data, error } = await supabase!
        .from("listings")
        .select("id,title,kind,verification_status")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) setListingsError(error.message);
      else {
        const ownedListings = (data ?? []) as OwnedListing[];
        setListings(ownedListings);
        if (requestedListingId && !ownedListings.some((listing) => listing.id === requestedListingId)) {
          setSelectedListingId("");
        } else if (!requestedListingId && ownedListings.length === 1) {
          setSelectedListingId(ownedListings[0].id);
        }
      }
      setListingsLoading(false);
    };

    void loadOwnedListings();
    return () => {
      cancelled = true;
    };
  }, [requestedListingId]);

  const paymentHref = (plan: Plan) => {
    const params = new URLSearchParams({ plan: plan.id, period: "monthly" });
    if (plan.requiresListing && selectedListingId) params.set("listing_id", selectedListingId);
    return `/payments/new?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative isolate overflow-hidden border-b border-neutral-800 bg-[#090909]">
        <div className="absolute -right-24 -top-36 -z-10 h-96 w-96 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <div className="absolute -bottom-48 left-[25%] -z-10 h-80 w-80 rounded-full bg-amber-300/[0.07] blur-3xl" />
        <div className="mx-auto max-w-6xl px-5 py-14 text-center sm:px-8 sm:py-20">
          <Badge className="border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-amber-200 hover:bg-amber-300/10">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Honeybee memberships
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose the right way to <span className="text-[#f17d83]">connect or grow.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
            Five clear monthly options, with pricing up front. Pick the one that fits what you came to do.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-300">
            <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-300" /> Verified listings</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Admin-reviewed payments</span>
            <span className="inline-flex items-center gap-2"><Crown className="h-4 w-4 text-amber-300" /> Monthly, no daily tiers</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="plans-heading">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f17d83]">Simple monthly pricing</p>
            <h2 id="plans-heading" className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Five plans. One clear next step.</h2>
          </div>
          {pricingError && <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">Could not load current subscription fees: {pricingError}</p>}
          <p className="text-xs text-neutral-400">All prices are in UGX and cover one month.</p>
        </div>

        {requestedListingId && (
          <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
            Choose Advertising below to submit this listing for a one-month featured campaign.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const style = accentStyles[plan.accent];
            const Icon = plan.icon;
            const activeListing = listings.find((listing) => listing.id === selectedListingId);
            const planIsAvailable = activePlans.has(plan.id) && planPrices[plan.id] !== undefined;
            const needsListingSelection = plan.requiresListing && !selectedListingId;
            const checkoutDisabled =
              pricingLoading ||
              !planIsAvailable ||
              (plan.requiresListing && (listingsLoading || listings.length === 0 || needsListingSelection)) ||
              (plan.requiresListing && !!selectedListingId && !activeListing);

            return (
              <Card
                key={plan.id}
                id={plan.id === "advertiser_premium" ? "advertising-card" : undefined}
                className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-neutral-900/80 text-white transition duration-200 hover:-translate-y-1 hover:shadow-xl ${style.border} ${
                  plan.popular ? "shadow-lg shadow-rose-950/30" : "border-neutral-800"
                }`}
              >
                {plan.popular && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-[#d3444d] to-amber-300" />}
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}><Icon className="h-5 w-5" /></div>
                    <Badge className={`border text-[10px] font-semibold ${style.badge}`}>{plan.audience}</Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{plan.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-neutral-400">{plan.description}</p>
                  <div className="mt-5 border-b border-neutral-800 pb-5">
                    <span className="text-3xl font-extrabold tracking-tight">{pricingLoading ? "Loading..." : planIsAvailable ? formatUGX(planPrices[plan.id]) : "Unavailable"}</span>
                    <span className="ml-1 text-sm text-neutral-400">/ month</span>
                  </div>

                  {plan.requiresListing && (
                    <div className="mt-4">
                      <label htmlFor="advertising-listing" className="text-xs font-semibold text-neutral-200">Choose your listing</label>
                      {listings.length > 0 ? (
                        <select
                          id="advertising-listing"
                          value={selectedListingId}
                          onChange={(event) => setSelectedListingId(event.target.value)}
                          className="mt-2 h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-amber-300"
                        >
                          <option value="">Select a listing</option>
                          {listings.map((listing) => (
                            <option key={listing.id} value={listing.id}>
                              {listing.title} · {listing.verification_status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs leading-5 text-neutral-400">
                          {listingsLoading ? "Loading your listings…" : listingsError || (
                            <>
                              You need a listing before buying ad placement.{" "}
                              <Link href="/login?next=%2Fsubscribe" className="font-semibold text-rose-300 underline underline-offset-2">Sign in</Link>
                              {" or "}
                              <Link href="/advertise" className="font-semibold text-rose-300 underline underline-offset-2">create a listing</Link>.
                            </>
                          )}
                        </div>
                      )}
                      {activeListing && activeListing.verification_status !== "verified" && (
                        <p className="mt-2 text-xs leading-5 text-amber-200">
                          Your ad can be paid for now, but the listing must be approved before it appears publicly.
                        </p>
                      )}
                    </div>
                  )}

                  <ul className="my-5 flex-1 space-y-3 text-sm text-neutral-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {checkoutDisabled ? (
                    <Button disabled className="h-11 w-full rounded-xl bg-neutral-800 text-neutral-500">
                      {pricingLoading
                        ? "Loading subscription fees…"
                        : !planIsAvailable
                          ? "Plan unavailable"
                          : listingsLoading && plan.requiresListing
                            ? "Loading listings…"
                            : "Select a listing first"}
                    </Button>
                  ) : (
                    <Link href={paymentHref(plan)} className="mt-auto block">
                      <Button className={`h-11 w-full rounded-xl font-bold ${plan.popular ? "bg-[#d3444d] text-white hover:bg-[#ad3039]" : "bg-white text-neutral-950 hover:bg-neutral-200"}`}>
                        Choose {plan.name} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-sm sm:grid-cols-3 sm:px-8">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <p className="leading-5 text-neutral-300"><strong className="text-white">Trust first.</strong> Paid listings and submitted payments are reviewed before benefits go live.</p>
          </div>
          <div className="flex gap-3">
            <SmartphoneIcon />
            <p className="leading-5 text-neutral-300"><strong className="text-white">Simple payment.</strong> Submit your MTN MoMo or Airtel Money transaction reference.</p>
          </div>
          <div className="flex gap-3">
            <Crown className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="leading-5 text-neutral-300"><strong className="text-white">Clear timing.</strong> Each price is for one month and starts after payment verification.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
        <p className="text-sm text-neutral-400">Not sure which plan is for you? Start with what you want to do.</p>
        <Link href="/advertise" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f17d83] hover:text-rose-200">
          Create a provider listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Loading subscription options…</div>}>
      <SubscribeContent />
    </Suspense>
  );
}

function SmartphoneIcon() {
  return <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-300/40 text-[9px] font-bold text-amber-200">UGX</span>;
}
