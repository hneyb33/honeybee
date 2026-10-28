"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

type ProviderListing = {
  id: string;
  title: string;
  slug: string;
  verification_status: string;
  rating: number | null;
  review_count: number | null;
};

type ProviderBooking = {
  id: string;
  listing_id: string;
  starts_at: string;
  duration_hours: number | null;
  experience_type: string | null;
  status: string;
};

const activeStatuses = ["accepted", "travelling", "arrived", "in_progress"];
const requestStatuses = ["requested"];

export default function ProviderOperationsDashboard() {
  const [name, setName] = useState("");
  const [accountKind, setAccountKind] = useState("");
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<"available" | "busy" | "offline">("available");
  const [presenceError, setPresenceError] = useState("");

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      if (!supabase) {
        setLoadError("Provider dashboard is unavailable because the database is not configured.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        if (active) {
          setLoadError("Sign in to view your provider operations.");
          setLoading(false);
        }
        return;
      }

      const [profileResult, listingsResult] = await Promise.all([
        supabase.from("profiles").select("name, account_kind").eq("id", authData.user.id).maybeSingle(),
        supabase
          .from("listings")
          .select("id, title, slug, verification_status, rating, review_count")
          .eq("user_id", authData.user.id),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (listingsResult.error) throw listingsResult.error;
      if (!active) return;

      setName(profileResult.data?.name ?? "");
      setAccountKind(profileResult.data?.account_kind ?? "");
      const ownedListings = listingsResult.data ?? [];
      setListings(ownedListings);
      if (ownedListings.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("id, listing_id, starts_at, duration_hours, experience_type, status")
        .in("listing_id", ownedListings.map((listing) => listing.id))
        .in("status", [...requestStatuses, ...activeStatuses])
        .order("starts_at", { ascending: true });
      if (bookingError) throw bookingError;
      if (active) setBookings(bookingData ?? []);
    };

    void loadDashboard()
      .catch((error: unknown) => {
        console.error("Could not load provider operations:", error);
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load provider data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!listings.length || !client) return;
    let active = true;
    let signedIn = false;

    const updatePresence = async (online: boolean) => {
      const { error } = await client.rpc("set_listing_presence", { p_online: online });
      if (error && active) {
        setPresenceError(error.message);
        console.error("Could not update provider online status:", error.message);
      } else if (active) {
        setPresenceError("");
      }
    };
    const heartbeat = () => {
      if (signedIn) void updatePresence(status !== "offline" && document.visibilityState === "visible");
    };
    const clearPresence = () => {
      if (signedIn) void updatePresence(false);
    };

    void client.auth.getUser().then(({ data, error }) => {
      if (error) {
        setPresenceError(error.message);
        console.error("Could not verify provider session:", error.message);
      } else if (data.user) {
        signedIn = true;
        heartbeat();
      }
    });

    const interval = window.setInterval(heartbeat, 60_000);
    document.addEventListener("visibilitychange", heartbeat);
    window.addEventListener("pagehide", clearPresence);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
      window.removeEventListener("pagehide", clearPresence);
    };
  }, [listings.length, status]);

  const listingById = useMemo(() => new Map(listings.map((listing) => [listing.id, listing])), [listings]);
  const newRequests = bookings.filter((booking) => requestStatuses.includes(booking.status));
  const activeBookings = bookings.filter((booking) => activeStatuses.includes(booking.status));
  const reviewCount = listings.reduce((total, listing) => total + (listing.review_count ?? 0), 0);
  const rating = reviewCount
    ? listings.reduce((total, listing) => total + (listing.rating ?? 0) * (listing.review_count ?? 0), 0) / reviewCount
    : null;

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-muted-foreground">Loading your provider operations…</div>;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="space-y-4 rounded-3xl p-8">
          <h1 className="text-2xl font-bold">Provider Operations</h1>
          <p role="alert" className="text-sm text-destructive">{loadError}</p>
          <Link href="/login"><Button>Sign in</Button></Link>
        </Card>
      </div>
    );
  }

  const registered = ["specialist", "model", "agency"].includes(accountKind);
  if (!registered || listings.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="space-y-4 rounded-3xl p-8">
          <Badge variant="outline">{registered ? "Finish registration" : "Become a provider"}</Badge>
          <h1 className="text-2xl font-bold">
            {registered ? "Complete your provider listing" : `Welcome${name ? `, ${name}` : ""}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {registered
              ? "Your provider account does not have a listing yet. Continue onboarding to publish your services."
              : "Register as a service provider or model to manage your listing and receive booking requests here."}
          </p>
          <Link href={registered ? "/provider/onboarding" : "/advertise"}>
            <Button>{registered ? "Continue onboarding" : "Register to provide services"}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase text-muted-foreground">Provider Operations Hub</span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {name ? `Welcome, ${name}` : "Provider Operations"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} active listing{listings.length === 1 ? "" : "s"} connected to your account.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5 shadow-sm">
          {(["available", "busy", "offline"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              aria-pressed={status === value}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                status === value ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {presenceError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          Could not sync your online status: {presenceError}. Apply the latest Supabase migration to enable presence.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl p-5">
          <span className="text-xs font-semibold text-muted-foreground">New requests</span>
          <div className="mt-2 text-3xl font-extrabold">{newRequests.length}</div>
          <span className="text-[11px] text-muted-foreground">Awaiting your response</span>
        </Card>
        <Card className="rounded-3xl p-5">
          <span className="text-xs font-semibold text-muted-foreground">Active bookings</span>
          <div className="mt-2 text-3xl font-extrabold">{activeBookings.length}</div>
          <span className="text-[11px] text-muted-foreground">Current and upcoming</span>
        </Card>
        <Card className="rounded-3xl p-5">
          <span className="text-xs font-semibold text-muted-foreground">Client rating</span>
          <div className="mt-2 flex items-center gap-1.5 text-3xl font-extrabold">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" /> {rating === null ? "New" : rating.toFixed(1)}
          </div>
          <span className="text-[11px] text-muted-foreground">{reviewCount} verified reviews</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Booking requests</h2>
            <Badge variant="outline">From your listings</Badge>
          </div>
          {newRequests.length === 0 ? (
            <div className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
              No booking requests right now.
            </div>
          ) : (
            <div className="space-y-3">
              {newRequests.map((booking) => (
                <Card key={booking.id} className="space-y-3 rounded-3xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold">{listingById.get(booking.listing_id)?.title ?? "Your listing"}</h3>
                    <Badge variant="outline">Requested</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{booking.experience_type || "Booking request"}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(booking.starts_at).toLocaleString()}
                    {booking.duration_hours ? ` · ${booking.duration_hours} hours` : ""}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="space-y-4 rounded-3xl p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <Calendar className="h-4 w-4 text-airbnb-coral" /> Upcoming bookings
            </h3>
            {activeBookings.length === 0 ? (
              <p className="text-xs text-muted-foreground">Confirmed bookings will appear here.</p>
            ) : activeBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="space-y-1 rounded-2xl border border-border p-3.5">
                <div className="text-xs font-bold">{listingById.get(booking.listing_id)?.title ?? "Your listing"}</div>
                <div className="text-xs text-muted-foreground">{new Date(booking.starts_at).toLocaleString()}</div>
                <div className="text-[11px] font-semibold capitalize text-emerald-600">{booking.status.replaceAll("_", " ")}</div>
              </div>
            ))}
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h3 className="font-bold">Quick Shortcuts</h3>
            <div className="space-y-2">
              <Link href="/provider/onboarding" className="block">
                <Button variant="outline" className="w-full justify-between rounded-xl text-xs">
                  <span>Edit Profile &amp; Services</span><ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/subscribe" className="block">
                <Button variant="outline" className="w-full justify-between rounded-xl text-xs">
                  <span>Manage Listing Subscription</span><ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
