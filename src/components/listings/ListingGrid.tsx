import React from "react";
import { Listing } from "@/lib/supabase/types";
import { ListingCard } from "./ListingCard";

interface ListingGridProps {
  listings: Listing[];
  title?: string;
  onResetFilters?: () => void;
  loading?: boolean;
  error?: string;
}

export function ListingGrid({
  listings,
  title = "Popular near Kampala",
  onResetFilters,
  loading = false,
  error = "",
}: ListingGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-4 sm:px-8">
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-[#43574a] sm:text-base dark:text-neutral-200">
          {title}
        </h2>
        <span className="shrink-0 rounded-full bg-[#eef1eb] px-3 py-1.5 text-xs font-semibold text-[#53675a] dark:bg-neutral-800 dark:text-neutral-300">
          {listings.length} {listings.length === 1 ? "match" : "matches"}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading verified profiles...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          Could not load verified profiles: {error}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center sm:p-12">
          <h3 className="text-lg font-semibold text-foreground">No profiles in this search yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t find verified profiles matching these filters. Try another neighbourhood or broaden your search.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-6 rounded-full bg-[#d3444d] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#ad3039]"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
