"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Share2,
  Heart,
  ShieldCheck,
  Award,
  Clock,
  Compass,
  Check,
  Globe2,
  Calendar,
} from "lucide-react";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";
import { Listing } from "@/lib/supabase/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/map-listing";
import { PhotoMosaic } from "@/components/listings/PhotoMosaic";
import { ServiceOfferings } from "@/components/listings/ServiceOfferings";
import { ReviewSection } from "@/components/listings/ReviewSection";
import { StickyBookingBar } from "@/components/booking/StickyBookingBar";
import { YouMayAlsoLike } from "@/components/listings/YouMayAlsoLike";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProfileDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [listing, setListing] = useState<Listing | undefined>(
    () => MOCK_LISTINGS.find((item) => item.slug === slug)
  );
  const [relatedListings, setRelatedListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [profileVideos, setProfileVideos] = useState<Array<{ url: string; thumbnailUrl: string | null }>>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadListing = async () => {
      setProfileVideos([]);
      if (!supabase) {
        setListing(MOCK_LISTINGS.find((item) => item.slug === slug));
        setRelatedListings(MOCK_LISTINGS);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("slug", slug)
        .eq("verification_status", "verified")
        .maybeSingle();

      if (error) {
        if (!cancelled) {
          setLoadError(error.message);
          setListing(undefined);
          setLoading(false);
        }
        return;
      }

      if (!data) {
        if (!cancelled) {
          setListing(undefined);
          setLoading(false);
        }
        return;
      }

      const [mediaResult, offeringsResult, relatedResult] = await Promise.all([
        supabase
          .from("profile_media")
          .select("url,kind,sort_order,thumbnail_url")
          .eq("listing_id", data.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("profile_offerings")
          .select("id,listing_id,group_name,name,price,pricing_model,turnaround,location_type,sort_order")
          .eq("listing_id", data.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("listings")
          .select("*")
          .eq("verification_status", "verified")
          .neq("id", data.id)
          .order("is_featured", { ascending: false })
          .order("rating", { ascending: false })
          .limit(12),
      ]);

      if (mediaResult.error || offeringsResult.error) {
        if (!cancelled) {
          setLoadError(mediaResult.error?.message ?? offeringsResult.error?.message ?? "Could not load profile details.");
          setListing(undefined);
          setLoading(false);
        }
        return;
      }

      const mappedListing = mapListingRow(
        data,
        (mediaResult.data ?? []).filter((media) => media.kind === "photo").map((media) => media.url),
        offeringsResult.data ?? []
      );
      const videos = (mediaResult.data ?? [])
        .filter((media) => media.kind === "video")
        .map((media) => ({ url: media.url, thumbnailUrl: media.thumbnail_url }));
      if (relatedResult.error) {
        console.error("Could not load recommended profiles:", relatedResult.error.message);
      }

      if (!cancelled) {
        setListing(mappedListing);
        setProfileVideos(videos);
        setRelatedListings((relatedResult.data ?? []).map((row) => mapListingRow(row)));
        setLoading(false);
      }
    };

    void loadListing();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center px-4">
        <h2 className="text-2xl font-bold">{loadError ? "Unable to load profile" : "Profile not found"}</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          {loadError || "The requested profile does not exist or may have been unlisted."}
        </p>
        <Link href="/">
          <Button className="mt-6 rounded-full bg-airbnb-coral text-white hover:bg-[#AD3039]">
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-32 sm:px-6 sm:py-8">
      {/* Title & Share Header */}
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {listing.escort_tier === "vip" ? (
              <Badge variant="vip" className="py-1">
                VIP Host
              </Badge>
            ) : listing.kind === "service" ? (
              <Badge variant="verified" className="py-1">
                Service Provider
              </Badge>
            ) : (
              <Badge variant="default" className="py-1">
                Verified Profile
              </Badge>
            )}
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {listing.service_type
                ? listing.service_type.replace("_", " ")
                : listing.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {listing.title}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-airbnb-coral" />
              {listing.neighborhood}, {listing.city}
            </span>
            {listing.nationality && <span>· {listing.nationality}</span>}
            <span>
              · ★ {listing.review_count > 0 ? listing.rating.toFixed(1) : "New"} (
              {listing.review_count} reviews)
            </span>
          </p>
        </div>

        {/* Share & Save Buttons */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="rounded-full gap-1.5 text-xs text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" /> Link copied
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" /> Share
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
            className="rounded-full gap-1.5 text-xs text-foreground"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
            {isFavorite ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Profile photo gallery */}
      <PhotoMosaic images={listing.images} title={listing.title} />
      {profileVideos.length > 0 && (
        <section className="mt-8 space-y-4" aria-labelledby="profile-videos-heading">
          <div>
            <h2 id="profile-videos-heading" className="text-xl font-bold text-foreground">Profile video reel</h2>
            <p className="mt-1 text-sm text-muted-foreground">Swipe to browse videos from this verified profile.</p>
          </div>
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 no-scrollbar sm:gap-4"
            aria-label={`${listing.title} video reel`}
          >
            {profileVideos.map((video, index) => (
              <div
                key={video.url}
                className="w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-black sm:w-[45%] lg:w-[31%]"
              >
                <video
                  src={video.url}
                  poster={video.thumbnailUrl ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-[3/4] w-full bg-black object-contain"
                  aria-label={`${listing.title} profile video ${index + 1}`}
                />
                <p className="bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  Video {index + 1} of {profileVideos.length}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profile Information & Highlights */}
      <div className="mt-8 border-b border-border pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {listing.tag || listing.title} · Hosted on Honeybee
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.summary_line}
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Honeybee verified
          </span>
          {(listing.has_certificate || listing.profile_details?.certified) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <Award className="h-3.5 w-3.5 text-amber-600" /> Certification listed
            </span>
          )}
          {listing.travel_km && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <Compass className="h-3.5 w-3.5 text-sky-600" /> Travels up to{" "}
              {listing.travel_km} km
            </span>
          )}
          {listing.languages && listing.languages.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <Globe2 className="h-3.5 w-3.5 text-purple-600" /> Spoken:{" "}
              {listing.languages.join(", ")}
            </span>
          )}
        </div>
      </div>

      {(listing.kind === "service" || listing.age || listing.profile_details?.orientation) && (
        <section className="grid gap-3 border-b border-border py-6 sm:grid-cols-2 lg:grid-cols-4">
          {listing.kind === "service" && listing.experience_band && (
            <DetailChip label="Experience" value={listing.experience_band} />
          )}
          {listing.kind === "service" && listing.service_type && (
            <DetailChip label="Specialty" value={listing.service_type.replaceAll("_", " ")} />
          )}
          {listing.kind === "escort" && listing.age && (
            <DetailChip label="Age" value={`${listing.age} years`} />
          )}
          {listing.kind === "escort" && listing.gender && (
            <DetailChip label="Gender" value={listing.gender} />
          )}
          {listing.profile_details?.orientation && (
            <DetailChip label="Orientation" value={listing.profile_details.orientation} />
          )}
          {listing.nationality && <DetailChip label="Nationality" value={listing.nationality} />}
        </section>
      )}

      {/* About Section */}
      <section className="border-b border-border py-8">
        <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">
          About
        </h3>
        <div className="relative max-w-3xl">
          <p
            className={`text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 ${
              aboutExpanded ? "" : "line-clamp-4"
            }`}
          >
            {listing.description}
          </p>
          {listing.description.length > 200 && (
            <button
              onClick={() => setAboutExpanded(!aboutExpanded)}
              className="mt-3 text-xs sm:text-sm font-bold text-foreground underline hover:text-airbnb-coral"
            >
              {aboutExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </section>

      {/* Services & Packages */}
      <ServiceOfferings
        offerings={listing.offerings}
        generalServices={listing.services_offered}
      />

      {/* Availability Schedule */}
      {listing.availability && listing.availability.length > 0 && (
        <section className="border-b border-border py-8">
          <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-airbnb-coral" /> Availability Schedule
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {listing.availability.map((day) => (
              <div
                key={day.label}
                className={`rounded-2xl border p-3 text-center transition-all ${
                  day.on
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-border bg-neutral-50 dark:bg-neutral-900 opacity-60"
                }`}
              >
                <div className="text-xs font-semibold text-foreground">
                  {day.label}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {day.on ? `${day.from} - ${day.to}` : "Off"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <ReviewSection
        rating={listing.rating}
        reviewCount={listing.review_count}
        listingTitle={listing.title}
      />

      <YouMayAlsoLike current={listing} listings={relatedListings} />

      {/* Sticky Bottom Booking & Chat Bar */}
      <StickyBookingBar listing={listing} />
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
