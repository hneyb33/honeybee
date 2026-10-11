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
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
      {/* Header bar */}
      <div className="mb-6 flex items-end justify-between gap-3 border-b border-border/40 pb-3">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-100">
          {title}
        </h2>
        <span className="shrink-0 text-xs sm:text-sm text-muted-foreground font-medium">
          {listings.length} {listings.length === 1 ? "profile" : "profiles"}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Loading verified profiles...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          Could not load verified profiles: {error}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">No verified profiles found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t find any verified providers matching your exact search or category filter. Try clearing filters or selecting another location.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-6 rounded-full bg-airbnb-coral px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E00B41] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
