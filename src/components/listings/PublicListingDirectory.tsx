"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";
import { mapListingRow } from "@/lib/supabase/map-listing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Listing } from "@/lib/supabase/types";

export function PublicListingDirectory({ agenciesOnly = false }: { agenciesOnly?: boolean }) {
  const [listings, setListings] = useState<Listing[]>(
    isSupabaseConfigured
      ? []
      : agenciesOnly
        ? MOCK_LISTINGS.filter((listing) => listing.advertiser_type === "agency")
        : MOCK_LISTINGS
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const loadListings = async () => {
      let query = client
        .from("listings")
        .select("*")
        .eq("verification_status", "verified")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (agenciesOnly) query = query.eq("advertiser_type", "agency");

      const { data, error: listingsError } = await query;
      if (listingsError) {
        if (!cancelled) {
          setError(listingsError.message);
          setLoading(false);
        }
        return;
      }

      const listingIds = (data ?? []).map((listing) => listing.id);
      const mediaByListing = new Map<string, string[]>();
      if (listingIds.length > 0) {
        const { data: media, error: mediaError } = await client
          .from("profile_media")
          .select("listing_id,url,sort_order")
          .in("listing_id", listingIds)
          .eq("kind", "photo")
          .order("sort_order", { ascending: true });
        if (mediaError) {
          if (!cancelled) {
            setError(mediaError.message);
            setLoading(false);
          }
          return;
        }
        for (const item of media ?? []) {
          const images = mediaByListing.get(item.listing_id) ?? [];
          images.push(item.url);
          mediaByListing.set(item.listing_id, images);
        }
      }

      if (!cancelled) {
        setListings(
          (data ?? []).map((listing) =>
            mapListingRow(listing, mediaByListing.get(listing.id) ?? [])
          )
        );
        setError("");
        setLoading(false);
      }
    };

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, [agenciesOnly]);

  const title = agenciesOnly ? "Agency listings" : "Classified ads";

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#f17d83]">
          Honeybee directory
        </p>
        <h1 className="relative mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
          {agenciesOnly
            ? "Explore verified profiles managed by agency advertisers across Uganda."
            : "Browse verified profiles and independent services from across Uganda."}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-neutral-400">
            <MapPin className="h-4 w-4" /> Discover all profiles
          </Link>
          <Link href={agenciesOnly ? "/register?advertiser_type=agency" : "/advertise"} className="inline-flex items-center gap-2 rounded-full bg-[#d3444d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ad3039]">
            {agenciesOnly ? "Register an agency" : "Post an ad"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <div className="mt-6">
        <ListingGrid listings={listings} loading={loading} error={error} title={agenciesOnly ? "Verified agency profiles" : "Verified listings"} />
      </div>
    </main>
  );
}
