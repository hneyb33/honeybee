"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, MapPin, Sparkles } from "lucide-react";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";

export function FeaturedAdsCarousel({ listings }: { listings: Listing[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (listings.length === 0) {
    return (
      <div className="relative flex h-[360px] w-full max-w-[530px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-neutral-700 bg-neutral-900/70 p-8 text-center sm:h-[400px]" aria-label="Featured advertisements">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">Featured placements</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">Your ad could be here</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-400">
          Ads selected by our admins will appear here after approval.
        </p>
        <Link href="/advertise" className="mt-6 inline-flex items-center rounded-full bg-[#d3444d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ad3039]">
          Post an ad
        </Link>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[530px]" aria-label="Admin-featured advertisements">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">Featured placements</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">Selected by Honeybee</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {listings.length > 1 && (
            <>
              <button type="button" onClick={() => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth, behavior: "smooth" })} aria-label="Previous featured ad" className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 text-neutral-200 transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth, behavior: "smooth" })} aria-label="Next featured ad" className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 text-neutral-200 transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 sm:text-xs">
            <Crown className="h-4 w-4 text-[#e5b34c]" /> Admin approved
          </span>
        </div>
      </div>

      <div ref={trackRef} className="featured-ads-mask flex h-[360px] snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 p-3 no-scrollbar sm:h-[400px] sm:p-4">
        {listings.map((listing, index) => {
          const href = listing.slug.trim() ? `/profiles/${listing.slug}` : null;
          const content = (
            <>
              <Image
                src={listing.cover_image || listing.images[0] || "/images/logo.jpeg"}
                alt={listing.title}
                fill
                sizes="(max-width: 640px) 78vw, 420px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#e5b34c]/40 bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ffe5a3] backdrop-blur">
                <Crown className="h-3 w-3" /> Admin featured
              </span>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {listing.kind === "service" ? "Service provider" : "Model"} · {listing.featured_tier ?? "Featured"}
                </p>
                <h3 className="mt-1 truncate font-display text-2xl font-semibold sm:text-3xl">{listing.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="h-4 w-4 shrink-0" /> {listing.neighborhood}, {listing.city}
                </p>
                {listing.kind === "service" && (
                  <p className="mt-3 text-sm font-bold text-white">
                    {formatUGX(listing.hourly_rate)} <span className="font-normal text-white/70">/ hour</span>
                  </p>
                )}
                {href && <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-950">View profile</span>}
              </div>
            </>
          );

          const cardClass = `group relative block h-full w-[min(78vw,420px)] shrink-0 overflow-hidden rounded-[1.5rem] bg-neutral-800 ${href ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c]" : "cursor-default"}`;
          return href ? (
            <Link
              key={`${listing.id}-${index}`}
              href={href}
              aria-label={`View featured ad: ${listing.title}`}
              className={`${cardClass} snap-start`}
            >
              {content}
            </Link>
          ) : (
            <article key={`${listing.id}-${index}`} className={`${cardClass} snap-start`}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}
