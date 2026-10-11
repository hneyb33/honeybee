"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatUGX } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_LISTINGS } from "@/lib/data/mock-profiles";

export default function ClientDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("honeybee_bookings");
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Sample mock booking for first-time display
      setBookings([
        {
          id: "HB-10928",
          listing_title: "Chef Samuel Kato",
          listing_image:
            "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80",
          starts_at: "Tomorrow • 1:30 PM",
          duration_hours: 3,
          price_amount: 240000,
          status: "confirmed",
          location: "Kololo, Kampala",
        },
      ]);
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Badge variant="secondary" className="mb-1 text-xs">
            Client Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Bookings &amp; Saved Profiles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your requested appointments, reviews, and active VIP access.
          </p>
        </div>

        <Link href="/subscribe">
          <Button className="rounded-full bg-airbnb-coral text-white hover:bg-[#E00B41] text-xs font-bold gap-1.5 shadow-sm">
            <Crown className="h-4 w-4" /> Manage VIP Subscription
          </Button>
        </Link>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-airbnb-coral" /> Upcoming Appointments
        </h2>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            You have no upcoming appointment requests. Browse providers to schedule a service or meeting.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b, idx) => (
              <Card key={idx} className="rounded-3xl border-border p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {b.listing_image && (
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 bg-neutral-100">
                      <Image
                        src={b.listing_image}
                        alt={b.listing_title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-foreground truncate">
                        {b.listing_title}
                      </h3>
                      <Badge
                        variant={b.status === "confirmed" ? "verified" : "secondary"}
                        className="text-[10px]"
                      >
                        {b.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{b.starts_at} ({b.duration_hours} hrs)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-airbnb-coral" />
                        <span>{b.location}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                      <span className="font-extrabold text-airbnb-coral text-sm">
                        {formatUGX(b.price_amount)}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        Booking ID: {b.id}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Verified Profiles */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> Recommended For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_LISTINGS.slice(0, 3).map((listing) => (
            <Link
              key={listing.id}
              href={`/profiles/${listing.slug}`}
              className="flex items-center gap-4 rounded-3xl border border-border p-4 hover:border-foreground/30 transition-colors bg-card shadow-sm group"
            >
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden shrink-0 bg-neutral-100">
                <Image
                  src={listing.cover_image}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-foreground truncate group-hover:text-airbnb-coral transition-colors">
                  {listing.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {listing.neighborhood}, {listing.city}
                </p>
                <p className="text-xs font-semibold text-foreground mt-1">
                  {formatUGX(listing.hourly_rate)} / hr
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
