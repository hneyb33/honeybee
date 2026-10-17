"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  listing_id: string;
  title: string;
  slug: string;
  kind: string;
  category: string;
  advertiser_type: string | null;
};

export function PublicMediaDirectory({ kind }: { kind: "photo" | "video" }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isVideo = kind === "video";
  const TitleIcon = isVideo ? Video : ImageIcon;

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      setError("Media galleries are unavailable until the Honeybee database is configured.");
      return;
    }
    let cancelled = false;

    const loadMedia = async () => {
      const { data: listings, error: listingsError } = await client
        .from("listings")
        .select("id,title,slug,kind,category,advertiser_type")
        .eq("verification_status", "verified");

      if (listingsError) {
        if (!cancelled) {
          setError(listingsError.message);
          setLoading(false);
        }
        return;
      }

      const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
      const listingIds = [...listingById.keys()];
      if (listingIds.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const { data: media, error: mediaError } = await client
        .from("profile_media")
        .select("id,url,thumbnail_url,listing_id")
        .eq("kind", kind)
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .limit(60);

      if (mediaError) {
        if (!cancelled) {
          setError(mediaError.message);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setItems(
          (media ?? []).flatMap((item) => {
            const listing = listingById.get(item.listing_id);
            return listing
              ? [{
                  ...item,
                  title: listing.title,
                  slug: listing.slug,
                  kind: listing.kind,
                  category: listing.category,
                  advertiser_type: listing.advertiser_type,
                }]
              : [];
          })
        );
        setError("");
        setLoading(false);
      }
    };

    void loadMedia();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#f17d83]">Honeybee gallery</p>
        <h1 className="relative mt-3 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <TitleIcon className="h-7 w-7 text-[#e5b34c]" />
          {isVideo ? "Profile videos" : "Profile photos"}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
          Recent {isVideo ? "videos" : "photos"} from verified provider profiles. Open a profile to learn more.
        </p>
      </header>

      {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading verified {isVideo ? "videos" : "photos"}...</p>
      ) : items.length === 0 && !error ? (
        <Card className="mt-6 rounded-2xl p-10 text-center">
          <p className="font-semibold">No {isVideo ? "videos" : "photos"} are available yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Check back as verified profiles add gallery media.</p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-2xl border-neutral-800 bg-[#101211]">
              {isVideo ? (
                <video
                  src={item.url}
                  poster={item.thumbnail_url ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-[3/4] w-full bg-black object-cover"
                  aria-label={`Video from ${item.title}`}
                />
              ) : (
                <Link href={`/profiles/${item.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                    <Image src={item.url} alt={`Photo from ${item.title}`} fill unoptimized sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                </Link>
              )}
              <Link href={`/profiles/${item.slug}`} className="flex items-center justify-between gap-2 px-3 pb-1 pt-3">
                <span className="truncate text-sm font-semibold text-foreground">{item.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#f17d83]" />
              </Link>
              <div className="px-3 pb-3">
                <span className="inline-flex rounded-full border border-neutral-700 px-2 py-1 text-[10px] font-semibold capitalize text-neutral-300">
                  {item.kind === "service"
                    ? "Specialist"
                    : item.advertiser_type === "agency"
                      ? "Agency"
                      : item.category}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
