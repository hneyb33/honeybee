"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectInput } from "../onboarding/onboarding-ui";
import { useMyAccount } from "./use-my-account";
import {
  IdentitySection,
  LocationSection,
  MediaSection,
  ServicesSection,
  StatusSection,
} from "./sections";

/**
 * My Account: a sectioned editor over the provider's own listing. Reached from
 * a card on `/provider`, deep-linkable per listing with `?listing=<id>` for
 * agencies that own more than one.
 */
function MyAccountContent() {
  const searchParams = useSearchParams();
  const c = useMyAccount(searchParams.get("listing") ?? "");

  if (c.loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-24 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading your account…
      </div>
    );
  }

  if (c.loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="space-y-4 rounded-3xl p-8">
          <h1 className="text-2xl font-bold">My Account</h1>
          <p role="alert" className="text-sm text-destructive">{c.loadError}</p>
          <Link href="/login?next=%2Fprovider%2Faccount">
            <Button>Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!c.listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="space-y-4 rounded-3xl p-8">
          <Badge variant="outline">No profile yet</Badge>
          <h1 className="text-2xl font-bold">Finish onboarding first</h1>
          <p className="text-sm text-muted-foreground">
            My Account edits the profile you create during onboarding. Complete that setup and your
            listing will appear here.
          </p>
          <Link href="/provider/onboarding">
            <Button className="rounded-xl bg-airbnb-coral text-white hover:bg-[#AD3039]">
              Continue onboarding <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/provider"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Provider Operations
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how your profile appears. Sections save independently.
          </p>
        </div>
        {c.listings.length > 1 && (
          <div className="w-full sm:w-72">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="account-listing">
              Editing profile
            </label>
            <SelectInput
              value={c.listing.id}
              onChange={c.selectListing}
              className="mt-1"
            >
              {c.listings.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.title} · {row.kind === "escort" ? "Companion" : "Service"}
                </option>
              ))}
            </SelectInput>
          </div>
        )}
      </div>

      {/* Keyed by listing so switching profiles remounts every section with
          fresh draft state instead of keeping the previous profile's values. */}
      <div key={c.listing.id} className="space-y-6">
        <StatusSection c={c} />
        <IdentitySection c={c} />
        <ServicesSection c={c} />
        <LocationSection c={c} />
        <MediaSection c={c} />
      </div>
    </div>
  );
}

export default function MyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-24 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading your account…
        </div>
      }
    >
      <MyAccountContent />
    </Suspense>
  );
}
