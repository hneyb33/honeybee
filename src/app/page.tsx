"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DiscoveryFilters, DiscoveryStatus } from "@/components/layout/DiscoveryFilters";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { OnlineNowStrip } from "@/components/listings/OnlineNowStrip";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";
import { calculateDistanceKm } from "@/lib/utils";
import { Listing } from "@/lib/supabase/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/map-listing";

const FEATURED_CITIES = ["Kampala", "Entebbe", "Jinja", "Mbarara"];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>(isSupabaseConfigured ? [] : MOCK_LISTINGS);
  const [listingsLoading, setListingsLoading] = useState(isSupabaseConfigured);
  const [listingsError, setListingsError] = useState("");
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>("all");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchOrientation, setSearchOrientation] = useState("all");
  const [searchService, setSearchService] = useState("all");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [onlineUpdatedAt, setOnlineUpdatedAt] = useState(Date.now());

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const loadListings = async () => {
      const { data, error } = await client
        .from("listings")
        .select("*")
        .eq("verification_status", "verified")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        if (!cancelled) {
          setListingsError(error.message);
          setListingsLoading(false);
        }
        return;
      }

      const listingIds = (data ?? []).map((listing) => listing.id);
      const mediaByListing = new Map<string, Array<{ url: string; sort_order: number }>>();

      if (listingIds.length > 0) {
        const { data: media, error: mediaError } = await client
          .from("profile_media")
          .select("listing_id,url,sort_order")
          .in("listing_id", listingIds)
          .order("sort_order", { ascending: true });

        if (mediaError) {
          if (!cancelled) {
            setListingsError(mediaError.message);
            setListingsLoading(false);
          }
          return;
        }

        for (const item of media ?? []) {
          const items = mediaByListing.get(item.listing_id) ?? [];
          items.push({ url: item.url, sort_order: item.sort_order });
          mediaByListing.set(item.listing_id, items);
        }
      }

      if (!cancelled) {
        setListings(
          (data ?? []).map((listing) =>
            mapListingRow(
              listing,
              mediaByListing.get(listing.id)?.map((item) => item.url) ?? []
            )
          )
        );
        setListingsLoading(false);
        setOnlineUpdatedAt(Date.now());
      }
    };

    void loadListings();
    const refreshInterval = window.setInterval(() => void loadListings(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const resetFilters = () => {
    setDiscoveryStatus("all");
    setSearchLocation("");
    setSearchOrientation("all");
    setSearchService("all");
    setUserCoords(null);
  };

  const onlineListings = useMemo(
    () => listings.filter((listing) =>
      listing.last_seen_at !== null &&
      listing.last_seen_at !== undefined &&
      Date.now() - Date.parse(listing.last_seen_at) < 5 * 60 * 1000
    ),
    [listings, onlineUpdatedAt]
  );

  const filteredListings = useMemo(() => {
    return listings
      .map((listing) => {
        const distance_km = userCoords
          ? calculateDistanceKm(
              userCoords.latitude,
              userCoords.longitude,
              listing.latitude,
              listing.longitude
            )
          : undefined;
        return { ...listing, distance_km };
      })
      .filter((listing) => {
        if (discoveryStatus === "online" && !onlineListings.some((online) => online.id === listing.id)) return false;
        if (
          discoveryStatus === "vip" &&
          listing.featured_tier !== "vip" &&
          listing.escort_tier !== "vip"
        ) return false;
        if (
          discoveryStatus === "premium" &&
          listing.featured_tier !== "premium" &&
          listing.escort_tier !== "premium"
        ) return false;
        if (discoveryStatus === "service" && listing.kind !== "service") return false;
        if (
          discoveryStatus === "new" &&
          (Date.now() - Date.parse(listing.created_at) > 14 * 24 * 60 * 60 * 1000)
        ) return false;

        if (searchOrientation !== "all") {
          const orientation = String(listing.profile_details?.orientation ?? "").toLowerCase().replaceAll(" ", "-");
          if (orientation !== searchOrientation) return false;
        }

        if (searchService !== "all" && listing.service_type !== searchService) {
          const matchInList = listing.services_offered.some((service) =>
            service.toLowerCase().includes(searchService.toLowerCase())
          );
          if (!matchInList) return false;
        }

        if (searchLocation && searchLocation !== "Near me" && !userCoords) {
          const locLower = searchLocation.toLowerCase();
          const matchArea =
            listing.neighborhood.toLowerCase().includes(locLower) ||
            listing.city.toLowerCase().includes(locLower);
          if (!matchArea) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distance_km !== undefined && b.distance_km !== undefined) {
          return a.distance_km - b.distance_km;
        }
        const tierPriority = (listing: Listing) => {
          const tier = listing.featured_tier ?? listing.escort_tier;
          return tier === "vip" ? 0 : tier === "premium" ? 1 : 2;
        };
        if (tierPriority(a) !== tierPriority(b)) return tierPriority(a) - tierPriority(b);
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return b.rating - a.rating;
      });
  }, [listings, discoveryStatus, onlineListings, searchLocation, searchOrientation, searchService, userCoords]);

  return (
    <div className="w-full">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-[#090909]">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#d3444d]/20 blur-3xl" />
        <div className="absolute -bottom-44 left-[38%] h-80 w-80 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold tracking-wide text-rose-300 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#d3444d]" />
              LOCAL PEOPLE. A MORE PERSONAL KIND OF SERVICE.
            </div>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.65rem]">
              Find your kind of{" "}
              <span className="italic text-[#e45b63]">good</span>
              , right around the corner.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
              Discover trusted companions and independent specialists across Uganda. Clear profiles, upfront rates, and real local connections.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#e45b63]" />
                Verified profiles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-[#e45b63]" />
                Clear pricing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="h-4 w-4 text-[#e45b63]" />
                Local connections
              </span>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[430px] w-full max-w-[530px] lg:block">
            <div
              className="absolute right-2 top-0 h-[380px] w-[72%] overflow-hidden rounded-[2rem] bg-cover bg-center shadow-[0_24px_70px_rgba(39,61,47,0.2)]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, transparent 55%, rgba(20,36,27,.72)), url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85')",
              }}
              role="img"
              aria-label="A Honeybee community member"
            >
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Made for real life</p>
                <p className="mt-1 font-display text-2xl">Meet someone remarkable.</p>
              </div>
            </div>
            <div
              className="absolute bottom-4 left-0 h-56 w-40 overflow-hidden rounded-[1.5rem] border-4 border-[#090909] bg-cover bg-center shadow-xl"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=500&q=80')",
              }}
              role="img"
              aria-label="A local culinary specialist at work"
            />
            <div className="absolute bottom-12 left-24 rounded-2xl border border-neutral-700 bg-neutral-900/95 px-4 py-3 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-950 text-rose-300">
                  <MapPin className="h-4 w-4" />
                </span>
                Kampala & beyond
              </div>
              <p className="mt-1 pl-10 text-xs text-neutral-400">Good things are closer than you think.</p>
            </div>
            <div className="absolute right-0 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5b34c] text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-neutral-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-3 sm:px-8">
          <div className="flex items-center gap-3 sm:justify-center">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#e45b63]" />
            <div>
              <p className="text-sm font-semibold text-foreground">Trust starts with verification</p>
              <p className="text-xs text-muted-foreground">Profiles are reviewed before they appear.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-center sm:border-x sm:border-border/70 sm:px-4">
            <MapPin className="h-5 w-5 shrink-0 text-[#e45b63]" />
            <div>
              <p className="text-sm font-semibold text-foreground">Rooted in your neighbourhood</p>
              <p className="text-xs text-muted-foreground">Explore providers and specialists nearby.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-center">
            <BadgeCheck className="h-5 w-5 shrink-0 text-[#e45b63]" />
            <div>
              <p className="text-sm font-semibold text-foreground">No guesswork on rates</p>
              <p className="text-xs text-muted-foreground">See profile pricing before you connect.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e45b63]">A little closer to home</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Start with a place you know
            </h2>
          </div>
          <Link
            href="/advertise"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e45b63] transition-colors hover:text-rose-300"
          >
            Share what you do <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {FEATURED_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSearchLocation(city);
                setUserCoords(null);
              }}
              aria-pressed={searchLocation.toLowerCase() === city.toLowerCase()}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                searchLocation.toLowerCase() === city.toLowerCase()
                  ? "border-[#d3444d] bg-[#d3444d] text-white"
                  : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-400"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <div className="md:hidden">
          <DiscoveryFilters
            locationListId="uganda-locations-mobile"
            location={searchLocation}
            orientation={searchOrientation}
            serviceType={searchService}
            status={discoveryStatus}
            onLocationChange={(value) => {
              setSearchLocation(value);
              setUserCoords(null);
            }}
            onOrientationChange={setSearchOrientation}
            onServiceTypeChange={setSearchService}
            onStatusChange={setDiscoveryStatus}
            onNearYou={(coordinates) => {
              setSearchLocation("Near me");
              setUserCoords(coordinates);
            }}
            onReset={resetFilters}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 sm:px-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-8">
        <div className="hidden md:block">
          <DiscoveryFilters
            locationListId="uganda-locations-desktop"
            location={searchLocation}
            orientation={searchOrientation}
            serviceType={searchService}
            status={discoveryStatus}
            onLocationChange={(value) => {
              setSearchLocation(value);
              setUserCoords(null);
            }}
            onOrientationChange={setSearchOrientation}
            onServiceTypeChange={setSearchService}
            onStatusChange={setDiscoveryStatus}
            onNearYou={(coordinates) => {
              setSearchLocation("Near me");
              setUserCoords(coordinates);
            }}
            onReset={resetFilters}
          />
        </div>
        <main className="min-w-0">
          <OnlineNowStrip listings={onlineListings} />
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e45b63]">Thoughtfully selected</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {searchLocation === "Near me"
                  ? "People close to you"
                  : searchLocation
                    ? `Meet people in ${searchLocation}`
                    : discoveryStatus === "service"
                      ? "Independent local specialists"
                      : discoveryStatus === "vip"
                        ? "Standout profiles"
                        : discoveryStatus === "online"
                          ? "Online now"
                          : discoveryStatus === "new"
                            ? "New to Honeybee"
                            : "Find your next favourite"}
              </h2>
            </div>
            <div className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <Compass className="h-4 w-4 text-[#e45b63]" />
              Discover across Uganda
            </div>
          </div>

          <ListingGrid
            listings={filteredListings}
            loading={listingsLoading}
            error={listingsError}
            title={userCoords ? "Sorted by distance from your location" : "Available now"}
            onResetFilters={resetFilters}
          />
        </main>
      </div>
    </div>
  );
}
