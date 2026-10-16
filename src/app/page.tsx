"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Handshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DiscoveryFilters, DiscoveryStatus } from "@/components/layout/DiscoveryFilters";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { OnlineNowStrip } from "@/components/listings/OnlineNowStrip";
import { FeaturedAdsCarousel } from "@/components/listings/FeaturedAdsCarousel";
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
          .eq("kind", "photo")
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
    const channel = client
      .channel("homepage-featured-listings")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        void loadListings();
      })
      .subscribe();
    const refreshInterval = window.setInterval(() => void loadListings(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      void client.removeChannel(channel);
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
  const featuredAds = useMemo(
    () =>
      isSupabaseConfigured
        ? listings.filter(
            (listing) =>
              listing.is_featured &&
              listing.featured_until !== null &&
              listing.featured_until !== undefined &&
              Date.parse(listing.featured_until) > Date.now()
          )
        : [],
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

      <OnlineNowStrip listings={onlineListings} />

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

      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:hidden">
        <div>
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

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)_210px] lg:items-start lg:gap-6">
        <aside className="hidden lg:sticky lg:top-24 lg:block">
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
        </aside>
        <main className="min-w-0">
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
        <aside aria-label="Featured advertisements" className="hidden min-h-[1px] lg:sticky lg:top-24 lg:block">
          {featuredAds[0]?.slug.trim() ? (
            <Link
              href={`/profiles/${featuredAds[0].slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-3xl border border-[#e5b34c]/30 bg-neutral-900 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c]"
            >
              <Image
                src={featuredAds[0].cover_image || featuredAds[0].images[0] || "/images/logo.jpeg"}
                alt={featuredAds[0].title}
                fill
                sizes="210px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#e5b34c]/40 bg-black/70 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#ffe5a3]">
                <Sparkles className="h-3 w-3" /> Admin featured
              </span>
              <div className="absolute inset-x-3 bottom-4 text-white">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">
                  {featuredAds[0].kind === "service" ? "Service provider" : "Model"}
                </p>
                <p className="mt-1 truncate text-sm font-bold">{featuredAds[0].title}</p>
                <p className="mt-1 truncate text-xs text-white/75">
                  {featuredAds[0].neighborhood}, {featuredAds[0].city}
                </p>
              </div>
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
