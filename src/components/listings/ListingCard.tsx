"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ChevronLeft, ChevronRight, ShieldCheck, Crown, MapPin } from "lucide-react";
import { Listing } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { CountryFlagBadge } from "@/components/listings/CountryFlagBadge";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const finishLoading = () => {
      if (!cancelled) setFavoriteLoaded(true);
    };
    const loadFavorite = async () => {
      if (!supabase) {
        finishLoading();
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Could not check saved profile state:", authError.message);
        finishLoading();
        return;
      }
      if (!authData.user) {
        finishLoading();
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", authData.user.id)
        .eq("listing_id", listing.id)
        .maybeSingle();
      if (error) {
        console.error("Could not load saved profile state:", error.message);
        finishLoading();
        return;
      }
      if (!cancelled) {
        setIsFavorite(Boolean(data));
        setFavoriteLoaded(true);
      }
    };

    void loadFavorite();
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const toggleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!supabase) {
      setFavoriteError("Saved profiles are unavailable until the database is configured.");
      return;
    }

    setFavoriteBusy(true);
    setFavoriteError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setFavoriteError(authError?.message ?? "Sign in to save profiles to your dashboard.");
      setFavoriteBusy(false);
      return;
    }

    const result = isFavorite
      ? await supabase.from("favorites").delete()
          .eq("user_id", authData.user.id)
          .eq("listing_id", listing.id)
      : await supabase.from("favorites").insert({
          user_id: authData.user.id,
          listing_id: listing.id,
        });
    if (result.error) {
      setFavoriteError(result.error.message);
    } else {
      setIsFavorite(!isFavorite);
    }
    setFavoriteBusy(false);
  };

  const photos = listing.images && listing.images.length > 0
    ? listing.images
    : [listing.cover_image];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <article className="group min-w-0">
      <div className="relative mb-3 aspect-[4/4.7] overflow-hidden rounded-[1.35rem] bg-[#eeeee8] shadow-[0_4px_18px_rgba(35,53,41,0.06)] dark:bg-neutral-800">
        <Link
          href={`/profiles/${listing.slug}`}
          aria-label={`View ${listing.title}'s profile`}
          className="absolute inset-0"
        >
          <Image
            src={photos[photoIndex]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
        </Link>
        <CountryFlagBadge country={listing.country} />

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5">
          {(listing.featured_tier ?? listing.escort_tier) === "vip" ? (
            <Badge variant="vip" className="flex items-center gap-1 rounded-full border-0 bg-[#fff4d8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#75501a]">
              <Crown className="h-3 w-3" /> Featured
            </Badge>
          ) : listing.kind === "service" ? (
            <Badge variant="verified" className="flex items-center gap-1 rounded-full border-0 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#285d47]">
              <ShieldCheck className="h-3 w-3" /> Specialist
            </Badge>
          ) : (
            <Badge variant="default" className="rounded-full border-0 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#285d47]">
              Verified
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => void toggleFavorite(event)}
          disabled={favoriteBusy || !favoriteLoaded}
          aria-label={isFavorite ? "Remove from saved profiles" : "Save profile"}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? "fill-[#d85a53] text-[#d85a53]" : "fill-black/20 text-white"
            }`}
          />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5" aria-label={`Photo ${photoIndex + 1} of ${photos.length}`}>
              {photos.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link href={`/profiles/${listing.slug}`} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#367458]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-[#21372c] transition-colors group-hover:text-[#367458] dark:text-neutral-100 dark:group-hover:text-emerald-300">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {listing.neighborhood}, {listing.city}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {listing.summary_line ||
                (listing.kind === "service" ? "Independent local specialist" : "Companionship")}
            </p>
            {listing.distance_km !== undefined && (
              <p className="mt-1.5 text-xs font-semibold text-[#367458] dark:text-emerald-300">
                {listing.distance_km} km away
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f3f1e9] px-2 py-1 text-xs font-bold text-[#394b40] dark:bg-neutral-800 dark:text-neutral-200">
            <Star className="h-3.5 w-3.5 fill-[#d5a23e] text-[#d5a23e]" />
            <span>{listing.review_count > 0 ? listing.rating.toFixed(1) : "New"}</span>
          </div>
        </div>

      </Link>
      {favoriteError && (
        <p role="alert" className="mt-2 text-xs text-destructive">{favoriteError}</p>
      )}
    </article>
  );
}
