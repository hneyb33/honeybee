"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";
import { mapListingRow } from "@/lib/supabase/map-listing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Listing } from "@/lib/supabase/types";

export function TelegramDirectory() {
  const [listings, setListings] = useState<Listing[]>(
    isSupabaseConfigured ? [] : MOCK_LISTINGS.filter((listing) => listing.telegram?.trim())
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const loadListings = async () => {
      const { data, error: listingsError } = await client
        .from("listings")
        .select("*")
        .eq("verification_status", "verified")
        .not("telegram", "is", null)
        .order("created_at", { ascending: false });

      if (listingsError) {
        if (!cancelled) {
          setError(listingsError.message);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setListings(
          (data ?? [])
            .filter((listing) => typeof listing.telegram === "string" && listing.telegram.trim().length > 0)
            .map((listing) => mapListingRow(listing))
        );
        setError("");
        setLoading(false);
      }
    };

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#f17d83]">Honeybee directory</p>
        <h1 className="relative mt-3 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <Send className="h-7 w-7 text-sky-400" />
          Telegram Links
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
          Find verified provider profiles that have shared a Telegram contact. Visit a profile or open its Telegram link directly.
        </p>
      </header>

      {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading verified Telegram contacts...</p>
      ) : listings.length === 0 && !error ? (
        <Card className="mt-6 rounded-2xl p-10 text-center">
          <p className="font-semibold">No Telegram contacts are available yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Check back as verified profiles add their Telegram contact.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const username = listing.telegram?.trim().replace(/^@/, "");
            if (!username) return null;
            const tag = listing.kind === "service"
              ? "Specialist"
              : listing.advertiser_type === "agency"
                ? "Agency"
                : listing.category;

            return (
              <Card key={listing.id} className="flex flex-col gap-4 rounded-2xl border-neutral-800 bg-[#101211] p-5">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border border-neutral-700 px-2 py-1 text-[10px] font-semibold capitalize text-neutral-300">
                    {tag}
                  </span>
                  <h2 className="mt-3 truncate text-lg font-semibold text-white">{listing.title}</h2>
                  <p className="mt-1 truncate text-sm text-neutral-400">{listing.neighborhood}, {listing.city}{listing.country ? `, ${listing.country}` : ""}</p>
                  <p className="mt-2 text-sm text-neutral-300">@{username}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link
                    href={`/profiles/${listing.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-neutral-400"
                  >
                    View profile <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={`https://t.me/${encodeURIComponent(username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    <Send className="h-4 w-4" /> Telegram
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
