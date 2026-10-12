"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/supabase/types";
import { mapListingRow } from "@/lib/supabase/map-listing";
import { formatUGX } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type DirectoryMode = "videos" | "images" | "agencies" | "classifieds";

const directoryCopy: Record<DirectoryMode, { eyebrow: string; title: string; description: string }> = {
  videos: {
    eyebrow: "Model video library",
    title: "Meet the models",
    description: "Browse verified model profiles with video introductions and profile details.",
  },
  images: {
    eyebrow: "Model image library",
    title: "Browse model profiles",
    description: "Explore verified model profiles and photo galleries. Open a profile to see more.",
  },
  agencies: {
    eyebrow: "Agency directory",
    title: "Registered agencies",
    description: "Find verified profiles published by registered agencies.",
  },
  classifieds: {
    eyebrow: "Honeybee classifieds",
    title: "Discover local listings",
    description: "Browse verified model and service-provider ads in an image-led directory.",
  },
};

type DirectoryEntry = {
  listing: Listing;
  media: string[];
};

export function DiscoveryDirectory({ mode }: { mode: DirectoryMode }) {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const copy = directoryCopy[mode];

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      if (!supabase || !isSupabaseConfigured) {
        setLoading(false);
        setError("Directory listings are unavailable until Supabase is configured.");
        return;
      }

      setLoading(true);
      setError("");
      let query = supabase
        .from("listings")
        .select("*")
        .eq("verification_status", "verified")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (mode === "videos" || mode === "images") query = query.eq("kind", "escort");
      if (mode === "agencies") query = query.eq("advertiser_type", "agency");

      const { data, error: listingError } = await query;
      if (listingError) {
        if (!cancelled) {
          setError(listingError.message);
          setLoading(false);
        }
        return;
      }

      const listingRows = data ?? [];
      const listingIds = listingRows.map((row) => row.id);
      if (listingIds.length === 0) {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }

      const mediaKind = mode === "videos" ? "video" : "photo";
      const { data: mediaRows, error: mediaError } = await supabase
        .from("profile_media")
        .select("listing_id,url,sort_order,kind")
        .eq("verification_status", "verified")
        .eq("kind", mediaKind)
        .in("listing_id", listingIds)
        .order("sort_order", { ascending: true });

      if (mediaError) {
        if (!cancelled) {
          setError(mediaError.message);
          setLoading(false);
        }
        return;
      }

      const mediaByListing = new Map<string, string[]>();
      for (const item of mediaRows ?? []) {
        const urls = mediaByListing.get(item.listing_id) ?? [];
        urls.push(item.url);
        mediaByListing.set(item.listing_id, urls);
      }

      const nextEntries = listingRows
        .map((row) => ({
          listing: mapListingRow(row, mediaByListing.get(row.id) ?? []),
          media: mediaByListing.get(row.id) ?? [],
        }))
        .filter((entry) => {
          if (mode === "videos") return entry.media.length > 0;
          if (mode === "images") return entry.media.length > 0 || Boolean(entry.listing.cover_image);
          return true;
        });

      if (!cancelled) {
        setEntries(nextEntries);
        setLoading(false);
      }
    };

    void loadDirectory();
    const channel = supabase
      ?.channel(`directory-${mode}-profile-media`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_media" }, () => {
        void loadDirectory();
      })
      .subscribe();
    return () => {
      cancelled = true;
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [mode]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">{copy.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400 sm:text-base">{copy.description}</p>
      </header>

      {loading ? (
        <p className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">Loading verified listings…</p>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-5 text-sm text-rose-200">{error}</p>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center">
          <h2 className="text-lg font-semibold text-white">Nothing to show just yet</h2>
          <p className="mt-2 text-sm text-neutral-400">
            {mode === "videos"
              ? "Verified model videos will appear here when providers add video media."
              : mode === "agencies"
                ? "Verified agency listings will appear here when registered agencies publish profiles."
                : "Verified listings will appear here as providers publish profiles."}
          </p>
        </div>
      ) : mode === "classifieds" ? (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {entries.map(({ listing }) => (
            <Link
              key={listing.id}
              href={`/profiles/${listing.slug}`}
              className="group mb-5 block break-inside-avoid overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 transition hover:-translate-y-1 hover:border-neutral-600 hover:shadow-xl"
            >
              <div className={`relative ${listing.images.length > 1 ? "aspect-[4/5]" : "aspect-[4/3]"} overflow-hidden bg-neutral-800`}>
                <Image
                  src={listing.cover_image || listing.images[0] || "/images/logo.jpeg"}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                <Badge className="absolute left-3 top-3 border border-amber-200/30 bg-black/65 text-amber-100 hover:bg-black/65">
                  {listing.is_featured ? "Admin featured" : listing.kind === "service" ? "Service provider" : "Model"}
                </Badge>
                {listing.images.length > 1 && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                    {listing.images.length} photos
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-white group-hover:text-rose-200">{listing.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400"><MapPin className="h-3.5 w-3.5" />{listing.neighborhood}, {listing.city}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-neutral-300"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />{listing.review_count ? listing.rating.toFixed(1) : "New"}</span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-5 text-neutral-400">{listing.summary_line || listing.description}</p>
                <p className="mt-4 border-t border-neutral-800 pt-3 text-sm font-bold text-white">{formatUGX(listing.hourly_rate)} <span className="text-xs font-normal text-neutral-500">/ hour</span></p>
              </div>
            </Link>
          ))}
        </div>
      ) : mode === "videos" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ listing, media }) => (
            <article key={listing.id} className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
              <div className="relative aspect-[4/5] bg-black">
                <video src={media[0]} poster={listing.cover_image || undefined} controls playsInline preload="metadata" className="h-full w-full object-cover">
                  Your browser does not support embedded videos.
                </video>
                {media.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white">{media.length} videos</span>}
              </div>
              <DirectoryProfileDetails listing={listing} tag={listing.tag || "Model"} />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ listing, media }) => (
            <article key={listing.id} className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
              <Link href={`/profiles/${listing.slug}`} aria-label={`View model profile ${listing.title}`} className="group relative block aspect-[4/5] overflow-hidden bg-neutral-800">
                <Image src={media[0] || listing.cover_image || "/images/logo.jpeg"} alt={listing.title} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{mode === "agencies" ? "Agency" : "Model"}</span>
              </Link>
              <DirectoryProfileDetails
                listing={listing}
                tag={mode === "agencies" ? listing.tag || "Registered agency" : listing.tag || "Verified model"}
                profileLabel={mode === "agencies" ? "View agency profile" : "View model profile"}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function DirectoryProfileDetails({
  listing,
  tag,
  profileLabel = "View model profile",
}: {
  listing: Listing;
  tag: string;
  profileLabel?: string;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate font-bold text-white">{listing.title}</h2>
        <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-300"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />Verified</span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400"><MapPin className="h-3.5 w-3.5" />{listing.neighborhood}, {listing.city}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tag.split(",").map((value) => (
          <Badge key={value} variant="secondary" className="max-w-full truncate text-[10px]">{value.trim()}</Badge>
        ))}
        {listing.escort_tier === "vip" && <Badge variant="vip" className="text-[10px]">VIP</Badge>}
      </div>
      <Link href={`/profiles/${listing.slug}`} className="mt-4 block">
        <Button variant="outline" className="w-full rounded-xl">{profileLabel} <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </Link>
    </div>
  );
}
