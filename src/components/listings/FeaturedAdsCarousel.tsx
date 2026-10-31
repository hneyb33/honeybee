"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, MapPin, Sparkles } from "lucide-react";
import { Ad } from "@/lib/supabase/types";
import { CountryFlagBadge } from "@/components/listings/CountryFlagBadge";

const AD_TYPE_LABELS: Record<Ad["ad_type"], string> = {
  fast: "Fast ad",
  independent: "Independent",
  agency: "Agency",
};

export function FeaturedAdsCarousel({ ads }: { ads: Ad[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [autoPaused, setAutoPaused] = useState(false);

  useEffect(() => {
    if (
      ads.length < 2 ||
      autoPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const track = trackRef.current;
    if (!track) return;

    const interval = window.setInterval(() => {
      if (document.hidden) return;
      const card = track.firstElementChild;
      if (!(card instanceof HTMLElement)) return;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const step = card.offsetWidth + gap;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [autoPaused, ads.length]);

  if (ads.length === 0) {
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
          {ads.length > 1 && (
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

      <div
        ref={trackRef}
        onMouseEnter={() => setAutoPaused(true)}
        onMouseLeave={() => setAutoPaused(false)}
        onFocusCapture={() => setAutoPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setAutoPaused(false);
        }}
        onTouchStart={() => setAutoPaused(true)}
        onTouchEnd={() => setAutoPaused(false)}
        className="featured-ads-mask flex h-[280px] snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden rounded-[1.5rem] border border-neutral-800 bg-neutral-950 p-2.5 no-scrollbar sm:h-[360px] sm:rounded-[2rem] sm:p-4"
      >
        {ads.map((ad, index) => {
          const href = ad.slug.trim() ? `/ad/${ad.slug}` : null;
          const location = [ad.neighborhood, ad.city].filter(Boolean).join(", ");
          const content = (
            <>
              <Image
                src={ad.cover_image || ad.images[0] || "/images/logo.jpeg"}
                alt={ad.title}
                fill
                sizes="(max-width: 640px) 78vw, 420px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />
              <CountryFlagBadge country={ad.country} />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#e5b34c]/40 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ffe5a3] backdrop-blur sm:left-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]">
                <Crown className="h-3 w-3" /> Admin featured
              </span>
              <div className="absolute inset-x-4 bottom-4 pr-24 text-white sm:inset-x-5 sm:bottom-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-[10px]">
                  {AD_TYPE_LABELS[ad.ad_type]} · {ad.featured_tier ?? "Featured"}
                </p>
                <h3 className="mt-1 truncate font-display text-xl font-semibold sm:text-2xl">{ad.title}</h3>
                {location && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-white/80 sm:mt-2 sm:gap-1.5 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> {location}
                  </p>
                )}
                {href && <span className="mt-3 inline-flex rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-neutral-950 sm:mt-4 sm:px-4 sm:py-2 sm:text-xs">View ad</span>}
              </div>
            </>
          );

          const cardClass = `group relative block h-full w-[min(68vw,290px)] shrink-0 overflow-hidden rounded-[1.25rem] bg-neutral-800 sm:w-[min(76vw,380px)] sm:rounded-[1.5rem] ${href ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b34c]" : "cursor-default"}`;
          return href ? (
            <Link
              key={`${ad.id}-${index}`}
              href={href}
              aria-label={`View featured ad: ${ad.title}`}
              className={`${cardClass} snap-start`}
            >
              {content}
            </Link>
          ) : (
            <article key={`${ad.id}-${index}`} className={`${cardClass} snap-start`}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}
