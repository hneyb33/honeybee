"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  Crown,
  Compass,
  LoaderCircle,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

type ClientBooking = {
  id: string;
  listing_id: string;
  starts_at: string;
  duration_hours: number;
  experience_type: string | null;
  status: string;
  created_at: string;
};

type SavedListing = {
  id: string;
  title: string;
  slug: string;
  kind: "escort" | "service";
  city: string;
  neighborhood: string;
  cover_image: string | null;
  images: string[] | null;
};

const ACTIVE_BOOKING_STATUSES = [
  "requested",
  "accepted",
  "travelling",
  "arrived",
  "in_progress",
];

function formatBookingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date to be confirmed"
    : new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

export default function ClientDashboardPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [bookingListings, setBookingListings] = useState<SavedListing[]>([]);
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadClientActivity = async () => {
      if (!supabase) {
        setError("Client activity is unavailable until the Honeybee database is configured.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (!cancelled) {
          setError(authError?.message ?? "Sign in to view your saved profiles and booking requests.");
          setLoading(false);
        }
        return;
      }

      const [bookingResult, favoriteResult, profileResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("id,listing_id,starts_at,duration_hours,experience_type,status,created_at")
          .eq("client_id", authData.user.id)
          .in("status", ACTIVE_BOOKING_STATUSES)
          .order("starts_at", { ascending: true }),
        supabase
          .from("favorites")
          .select("listing_id,created_at")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("account_kind")
          .eq("id", authData.user.id)
          .maybeSingle(),
      ]);

      if (bookingResult.error || favoriteResult.error || profileResult.error) {
        if (!cancelled) {
          setError(
            bookingResult.error?.message ??
            favoriteResult.error?.message ??
            profileResult.error?.message ??
            "Could not load your account activity."
          );
          setLoading(false);
        }
        return;
      }

      const bookingRows = (bookingResult.data ?? []) as ClientBooking[];
      const favoriteRows = favoriteResult.data ?? [];
      const listingIds = [...new Set([
        ...bookingRows.map((booking) => booking.listing_id),
        ...favoriteRows.map((favorite) => favorite.listing_id),
      ])];

      let listings: SavedListing[] = [];
      if (listingIds.length > 0) {
        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("id,title,slug,kind,city,neighborhood,cover_image,images")
          .in("id", listingIds)
          .eq("verification_status", "verified");

        if (listingsError) {
          if (!cancelled) {
            setError(listingsError.message);
            setLoading(false);
          }
          return;
        }
        listings = (listingsData ?? []) as SavedListing[];
      }

      if (!cancelled) {
        const listingById = new Map(listings.map((listing) => [listing.id, listing]));
        setBookings(bookingRows);
        setBookingListings(listings);
        setSavedListings(favoriteRows.flatMap((favorite) => {
          const listing = listingById.get(favorite.listing_id);
          return listing ? [listing] : [];
        }));
        setIsProvider(["specialist", "model", "agency"].includes(profileResult.data?.account_kind ?? ""));
        setError("");
        setLoading(false);
      }
    };

    void loadClientActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <Badge variant="secondary" className="mb-1 text-xs">Client Portal</Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Bookings &amp; Saved Profiles
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Your booking requests and the profiles you have saved.
          </p>
        </div>
        <Link href="/subscribe">
          <Button className="gap-1.5 rounded-full bg-airbnb-coral text-xs font-bold text-white shadow-sm hover:bg-[#AD3039]">
            <Crown className="h-4 w-4" /> Manage VIP Subscription
          </Button>
        </Link>
      </div>

      {!isProvider && (
        <Card className="flex flex-col items-start justify-between gap-4 rounded-3xl border-dashed p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-foreground">Offer your services on Honeybee</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Register as a service provider or model to create a listing and receive booking requests.
            </p>
          </div>
          <Link href="/advertise">
            <Button variant="outline" className="shrink-0">Register to provide services</Button>
          </Link>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading your account activity...
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <Calendar className="h-5 w-5 text-airbnb-coral" /> Pending &amp; Upcoming Bookings
            </h2>
            {bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any pending or upcoming booking requests.
                </p>
                <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-airbnb-coral hover:underline">
                  <Compass className="h-4 w-4" /> Browse verified profiles
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bookings.map((booking) => {
                  const listing = bookingListings.find((item) => item.id === booking.listing_id);
                  return (
                    <Card key={booking.id} className="rounded-3xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        {listing?.cover_image && (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-20 sm:w-20">
                            <Image src={listing.cover_image} alt={listing.title} fill sizes="80px" className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-foreground">
                                {listing?.title ?? booking.experience_type ?? "Booking request"}
                              </h3>
                              {listing && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 text-airbnb-coral" />
                                  {listing.neighborhood}, {listing.city}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {booking.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatBookingDate(booking.starts_at)} · {booking.duration_hours} hrs
                          </div>
                          {listing && (
                            <Link href={`/profiles/${listing.slug}`} className="mt-3 inline-block text-xs font-semibold text-airbnb-coral hover:underline">
                              View profile
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <Heart className="h-5 w-5 text-airbnb-coral" /> Saved Models &amp; Service Providers
            </h2>
            {savedListings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <Bookmark className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Profiles you save while browsing will appear here.
                </p>
                <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-airbnb-coral hover:underline">
                  <Compass className="h-4 w-4" /> Explore profiles
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedListings.map((listing) => (
                  <Link key={listing.id} href={`/profiles/${listing.slug}`} className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:border-foreground/30">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={listing.cover_image || listing.images?.[0] || "/images/logo.jpeg"}
                        alt={listing.title}
                        fill
                        sizes="64px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground group-hover:text-airbnb-coral">
                        {listing.title}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {listing.neighborhood}, {listing.city}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {listing.kind === "service" ? "Service provider" : "Model"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
