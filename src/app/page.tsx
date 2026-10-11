"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SearchCapsule } from "@/components/layout/SearchCapsule";
import { TierBar } from "@/components/layout/TierBar";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";
import { calculateDistanceKm } from "@/lib/utils";
import { Listing } from "@/lib/supabase/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/map-listing";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>(isSupabaseConfigured ? [] : MOCK_LISTINGS);
  const [listingsLoading, setListingsLoading] = useState(isSupabaseConfigured);
  const [listingsError, setListingsError] = useState("");
  const [activeTier, setActiveTier] = useState("all");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchService, setSearchService] = useState("all");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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
      }
    };

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (params: {
    location: string;
    category: string;
    serviceType: string;
    userCoords?: { latitude: number; longitude: number };
  }) => {
    setSearchLocation(params.location);
    setSearchCategory(params.category);
    setSearchService(params.serviceType);
    if (params.userCoords) {
      setUserCoords(params.userCoords);
    }
  };

  const resetFilters = () => {
    setActiveTier("all");
    setSearchLocation("");
    setSearchCategory("all");
    setSearchService("all");
    setUserCoords(null);
  };

  // Filter listings based on tier, location, category, and compute distance
  const filteredListings = useMemo(() => {
    return listings.map((listing) => {
      // Calculate distance if user coords are present
      let distance_km: number | undefined = undefined;
      if (userCoords) {
        distance_km = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          listing.latitude,
          listing.longitude
        );
      }
      return { ...listing, distance_km };
    })
      .filter((listing) => {
        // Tier / Category Bar Filter
        if (activeTier === "vip" && listing.escort_tier !== "vip") return false;
        if (activeTier === "premium" && listing.escort_tier !== "premium") return false;
        if (activeTier === "service" && listing.kind !== "service") return false;
        if (activeTier === "female" && listing.category !== "female") return false;
        if (activeTier === "male" && listing.category !== "male") return false;

        // Search Category Filter
        if (searchCategory !== "all" && listing.category !== searchCategory) {
          if (searchCategory === "service" && listing.kind !== "service") return false;
        }

        // Search Service Filter
        if (searchService !== "all") {
          if (listing.service_type !== searchService) {
            // Also check general services_offered
            const matchInList = listing.services_offered.some((s) =>
              s.toLowerCase().includes(searchService.toLowerCase())
            );
            if (!matchInList) return false;
          }
        }

        // Location Filter
        if (searchLocation && searchLocation !== "Near me") {
          const locLower = searchLocation.toLowerCase();
          const matchArea =
            listing.neighborhood.toLowerCase().includes(locLower) ||
            listing.city.toLowerCase().includes(locLower);
          if (!matchArea) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // If distance calculated, sort by nearest first
        if (a.distance_km !== undefined && b.distance_km !== undefined) {
          return a.distance_km - b.distance_km;
        }
        // VIP and featured first
        if (a.escort_tier === "vip" && b.escort_tier !== "vip") return -1;
        if (b.escort_tier === "vip" && a.escort_tier !== "vip") return 1;
        return b.rating - a.rating;
      });
  }, [listings, activeTier, searchLocation, searchCategory, searchService, userCoords]);

  return (
    <div className="w-full">
      {/* Airbnb Search Capsule */}
      <SearchCapsule
        location={searchLocation}
        category={searchCategory}
        serviceType={searchService}
        onSearch={handleSearch}
      />

      {/* Category / Tier Filter Bar */}
      <TierBar activeTier={activeTier} onSelectTier={setActiveTier} />

      {/* Page Title */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          {searchLocation === "Near me"
            ? "Verified providers near you"
            : searchLocation
            ? `Verified providers in ${searchLocation}`
            : activeTier === "service"
            ? "Top private specialists in Kampala"
            : activeTier === "vip"
            ? "Exclusive VIP profiles in Kampala"
            : "Places & Specialists to connect in Kampala"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified profiles with upfront pricing, certified ID checks, and instant WhatsApp/on-platform booking.
        </p>
      </div>

      {/* Listing Grid */}
      <ListingGrid
        listings={filteredListings}
        loading={listingsLoading}
        error={listingsError}
        title={
          userCoords
            ? "Sorted by distance from your location"
            : "Popular verified listings"
        }
        onResetFilters={resetFilters}
      />
    </div>
  );
}
