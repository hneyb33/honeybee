import Image from "next/image";
import Link from "next/link";
import { Listing } from "@/lib/supabase/types";

interface OnlineNowStripProps {
  listings: Listing[];
}

export function OnlineNowStrip({ listings }: OnlineNowStripProps) {
  return (
    <section aria-label="Models and service providers online now" className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e45b63]">Here right now</p>
          <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Models &amp; service providers online</h2>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{listings.length} online</span>
      </div>
      {listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/50 px-4 py-5 text-sm text-neutral-400">
          No profiles are online right now. Check back soon.
        </p>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/profiles/${listing.slug}`}
              aria-label={`View ${listing.title}, ${listing.kind === "service" ? "service provider" : "model"}, online now`}
              className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2"
            >
              <span className="relative block h-[4.5rem] w-[4.5rem] rounded-full bg-gradient-to-tr from-[#d3444d] via-[#e0ba69] to-[#d3444d] p-[3px]">
                <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-background bg-neutral-800">
                  <Image
                    src={listing.cover_image || listing.images[0] || "/images/logo.jpeg"}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                </span>
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
              </span>
              <span className="w-full truncate text-center text-xs font-semibold text-foreground group-hover:text-[#f17d83]">
                {listing.title}
              </span>
              <span className="-mt-1 text-[10px] text-muted-foreground">
                {listing.kind === "service" ? "Provider" : "Model"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
