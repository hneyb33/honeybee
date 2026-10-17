"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Listing } from "@/lib/supabase/types";
import { ListingCard } from "./ListingCard";

interface YouMayAlsoLikeProps {
  current: Listing;
  listings: Listing[];
}

export function YouMayAlsoLike({ current, listings }: YouMayAlsoLikeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const related = listings
    .filter((item) => item.id !== current.id)
    .map((item) => ({
      item,
      score:
        (item.city === current.city ? 2 : 0) +
        (item.kind === current.kind ? 2 : 0) +
        (item.service_type === current.service_type && current.service_type ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
    .slice(0, 8)
    .map(({ item }) => item);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Keep exploring</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">You may also like</h2>
          <p className="mt-1 text-sm text-muted-foreground">More trusted profiles around {current.city}.</p>
        </div>
        {related.length > 1 && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth, behavior: "smooth" })} aria-label="Previous recommended profiles" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth, behavior: "smooth" })} aria-label="Next recommended profiles" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 no-scrollbar">
        {related.map((listing) => (
          <div key={listing.id} className="w-[72vw] max-w-[18rem] shrink-0 snap-start sm:w-[17rem]">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
