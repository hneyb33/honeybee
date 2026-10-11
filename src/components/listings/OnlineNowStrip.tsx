import Image from "next/image";
import Link from "next/link";
import { Listing } from "@/lib/supabase/types";

interface OnlineNowStripProps {
  listings: Listing[];
}

export function OnlineNowStrip({ listings }: OnlineNowStripProps) {
  if (listings.length === 0) return null;

  return (
    <section aria-label="Providers online now" className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Here right now</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">Online now</h2>
        </div>
        <span className="text-xs text-muted-foreground">{listings.length} available</span>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">
        {listings.map((listing) => (
          <Link key={listing.id} href={`/profiles/${listing.slug}`} className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-2">
            <span className="relative block h-[4.25rem] w-[4.25rem] rounded-full bg-gradient-to-tr from-[#d3444d] via-[#e0ba69] to-[#d3444d] p-[3px]">
              <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-background">
                <Image src={listing.cover_image} alt={listing.title} fill sizes="68px" className="object-cover transition-transform group-hover:scale-110" />
              </span>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
            </span>
            <span className="w-full truncate text-center text-xs font-semibold text-foreground group-hover:text-[#c63843]">
              {listing.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
