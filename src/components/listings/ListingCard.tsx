"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ChevronLeft, ChevronRight, ShieldCheck, Crown } from "lucide-react";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

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

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Link href={`/profiles/${listing.slug}`} className="group block select-none">
      {/* Aspect Square Image Showcase */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          {listing.escort_tier === "vip" ? (
            <Badge variant="vip" className="flex items-center gap-1 py-1">
              <Crown className="h-3 w-3" /> VIP
            </Badge>
          ) : listing.kind === "service" ? (
            <Badge variant="verified" className="flex items-center gap-1 py-1">
              <ShieldCheck className="h-3 w-3" /> Specialist
            </Badge>
          ) : (
            <Badge variant="default" className="py-1">
              Verified
            </Badge>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:scale-110 active:scale-95 transition-transform"
          aria-label="Save to favorites"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite
                ? "fill-rose-500 text-rose-500"
                : "text-white fill-black/30 hover:fill-black/50"
            }`}
          />
        </button>

        {/* Image Slider */}
        <div className="relative h-full w-full">
          <Image
            src={photos[photoIndex]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
          />
        </div>

        {/* Navigation Arrows (Visible on Desktop Hover) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5">
              {photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === photoIndex ? "w-3 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Metadata & Details */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-neutral-900 group-hover:text-airbnb-coral transition-colors dark:text-neutral-100">
            {listing.title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {listing.neighborhood}, {listing.city}
          </p>
          <p className="truncate text-xs text-muted-foreground pt-0.5">
            {listing.summary_line ||
              (listing.kind === "service" ? "Specialist Service" : "Companionship")}
          </p>
          {listing.distance_km !== undefined && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-0.5">
              {listing.distance_km} km away
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>
            {listing.review_count > 0 ? listing.rating.toFixed(1) : "New"}
          </span>
        </div>
      </div>

      {/* Price Line */}
      <div className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
        <span className="font-semibold">{formatUGX(listing.hourly_rate)}</span>{" "}
        <span className="font-normal text-muted-foreground">/ hour</span>
      </div>
    </Link>
  );
}
