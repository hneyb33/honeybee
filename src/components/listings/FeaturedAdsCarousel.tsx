"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, MapPin, Star } from "lucide-react";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";

export function FeaturedAdsCarousel({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8" aria-label="Featured advertisements">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/60 p-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">Featured placements</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Your ad could be here</h2>
            <p className="mt-1 text-sm text-neutral-400">Promoted profiles appear here after admin approval.</p>
          </div>
          <Link href="/advertise" className="shrink-0 rounded-full bg-[#d3444d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ad3039]">
            Post an ad
          </Link>
        </div>
      </section>
    );
  }

  const cards = [...listings, ...listings];
  const renderCard = (listing: Listing, duplicate: boolean) => {
    const image = listing.cover_image || listing.images[0] || "/images/logo.jpeg";
    const content = (
      <>
        <Image
          src={image}
          alt={duplicate ? "" : listing.title}
          fill
          sizes="320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#e5b34c]/40 bg-black/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ffe5a3] backdrop-blur">
          <Crown className="h-3 w-3" /> Admin featured
        </span>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
              {listing.kind === "service" ? "Service provider" : "Model"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-white/90">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              {listing.review_count > 0 ? listing.rating.toFixed(1) : "New"}
            </span>
          </div>
          <p className="truncate font-display text-xl font-semibold">{listing.title}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/80">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {listing.neighborhood}, {listing.city}
          </p>
          <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-4 text-white/75">
            {listing.summary_line || listing.description}
          </p>
          <p className="mt-2 text-sm font-bold text-white">{formatUGX(listing.hourly_rate)} <span className="text-xs font-medium text-white/70">/ hour</span></p>
        </div>
      </>
    );
    const className = `group relative block h-72 w-[min(78vw,290px)] shrink-0 overflow-hidden rounded-2xl bg-neutral-800 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c] sm:h-80 sm:w-[320px] ${listing.slug ? "cursor-pointer" : "cursor-default"}`;

    if (!listing.slug) {
      return (
        <div
          key={`${listing.id}-${duplicate ? "duplicate" : "original"}`}
          aria-hidden={duplicate}
          aria-label={duplicate ? undefined : `${listing.title}, admin-featured listing`}
          className={className}
        >
          {content}
        </div>
      );
    }

    return (
      <Link
        key={`${listing.id}-${duplicate ? "duplicate" : "original"}`}
        href={`/profiles/${listing.slug}`}
        aria-hidden={duplicate}
        tabIndex={duplicate ? -1 : undefined}
        aria-label={`View admin-featured ${listing.kind === "service" ? "service provider" : "model"}: ${listing.title}`}
        className={className}
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8" aria-label="Admin-featured advertisements">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">Featured placements</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Selected by Honeybee</h2>
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-neutral-400 sm:inline-flex">
          <Crown className="h-4 w-4 text-[#e5b34c]" /> Admin approved
        </span>
      </div>

      <div className="featured-ads-mask overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 py-3">
        <div className="featured-ads-track flex w-max gap-3 px-3">
          {cards.map((listing, index) => renderCard(listing, index >= listings.length))}
        </div>
      </div>
    </section>
  );
}
