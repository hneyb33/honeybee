"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatUGX } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Star,
  Sparkles,
  Phone,
  Navigation,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

export default function ProviderOperationsDashboard() {
  const [status, setStatus] = useState<"available" | "busy" | "offline">("available");
  const [presenceError, setPresenceError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
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
      if (signedIn) {
        void updatePresence(status !== "offline" && document.visibilityState === "visible");
      }
    };
    const clearPresence = () => {
      if (signedIn) void updatePresence(false);
    };

    void client.auth.getUser().then(({ data, error }) => {
      if (error) {
        setPresenceError(error.message);
        console.error("Could not verify provider session:", error.message);
        return;
      }
      if (!data.user) return;
      signedIn = true;
      heartbeat();
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
  }, [status]);

  // Sample real-time incoming job queue
  const [incomingJobs, setIncomingJobs] = useState([
    {
      id: "HB-20481",
      customer: "Sarah M.",
      service: "Family Dinner Prep (3-Course)",
      location: "Kira, Wakiso",
      distance: "2.7 km away",
      appointment: "Today • 2:30 PM",
      budget: 80000,
      state: "requested",
    },
    {
      id: "HB-20482",
      customer: "Ronald T.",
      service: "Weekend Barbecue Catering",
      location: "Najjera, Kampala",
      distance: "3.4 km away",
      appointment: "Tomorrow • 1:00 PM",
      budget: 150000,
      state: "requested",
    },
  ]);

  const handleJobAction = (id: string, action: "accepted" | "declined") => {
    setIncomingJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, state: action } : job))
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Status Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold text-muted-foreground">
            Provider Operations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Good morning, Samuel
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Profile strength: <strong className="text-emerald-600">92% Complete</strong> · Certified ID Verified
          </p>
        </div>

        {/* Live Availability Toggle */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5 shadow-sm">
          <button
            onClick={() => setStatus("available")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              status === "available"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Available
          </button>
          <button
            onClick={() => setStatus("busy")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              status === "busy"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Busy
          </button>
          <button
            onClick={() => setStatus("offline")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              status === "offline"
                ? "bg-neutral-800 text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Offline
          </button>
        </div>
      </div>
      {presenceError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          Could not sync your online status: {presenceError}. Apply the latest Supabase migration to enable presence.
        </p>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl p-5">
          <span className="text-xs text-muted-foreground font-semibold">New Requests</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {incomingJobs.filter((j) => j.state === "requested").length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for review</span>
        </Card>

        <Card className="rounded-3xl p-5">
          <span className="text-xs text-muted-foreground font-semibold">Active Jobs</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">2</div>
          <span className="text-[11px] text-muted-foreground">Scheduled this week</span>
        </Card>

        <Card className="rounded-3xl p-5">
          <span className="text-xs text-muted-foreground font-semibold">Client Rating</span>
          <div className="mt-2 flex items-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-foreground">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" /> 4.95
          </div>
          <span className="text-[11px] text-muted-foreground">From 28 verified reviews</span>
        </Card>

        <Card className="rounded-3xl p-5">
          <span className="text-xs text-muted-foreground font-semibold">Weekly Earnings</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-airbnb-coral">
            {formatUGX(480000)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">+18% vs last week</span>
        </Card>
      </div>

      {/* Main Operations Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incoming Job Requests Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Incoming Job Requests
            </h2>
            <Badge variant="outline">Live Queue</Badge>
          </div>

          {incomingJobs.length === 0 ? (
            <div className="rounded-3xl border border-border p-8 text-center text-muted-foreground text-sm">
              No new incoming requests right now.
            </div>
          ) : (
            <div className="space-y-3">
              {incomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4 hover:border-foreground/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">{job.id}</span>
                      <h3 className="text-base font-bold text-foreground">{job.service}</h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-extrabold text-airbnb-coral">
                        {formatUGX(job.budget)}
                      </span>
                      <span className="text-xs text-muted-foreground block">Agreed Fee</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-foreground shrink-0" />
                      <span>{job.customer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-airbnb-coral shrink-0" />
                      <span>
                        {job.location} ({job.distance})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-foreground shrink-0" />
                      <span>{job.appointment}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {job.state === "requested" ? (
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={() => handleJobAction(job.id, "accepted")}
                        className="flex-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 h-10 text-xs"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Accept Job
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleJobAction(job.id, "declined")}
                        className="flex-1 rounded-xl text-destructive hover:bg-destructive/10 h-10 text-xs"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Decline
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Status: {job.state.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule & Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-airbnb-coral" /> Today&apos;s Schedule
            </h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-border p-3.5 space-y-1">
                <div className="font-bold text-foreground">10:00 AM – 1:00 PM</div>
                <div className="text-muted-foreground">Intimate 3-Course Lunch • Kololo</div>
                <div className="text-[11px] text-emerald-600 font-semibold">Client Confirmed</div>
              </div>

              <div className="rounded-2xl border border-border p-3.5 space-y-1">
                <div className="font-bold text-foreground">15:00 PM – 17:30 PM</div>
                <div className="text-muted-foreground">Menu Consultation &amp; Prep • Ntinda</div>
                <div className="text-[11px] text-amber-600 font-semibold">Starts in 3 hours</div>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl p-6 space-y-3">
            <h3 className="font-bold text-base text-foreground">Quick Shortcuts</h3>
            <div className="space-y-2">
              <Link href="/provider/onboarding" className="block">
                <Button variant="outline" className="w-full justify-between rounded-xl text-xs">
                  <span>Edit Profile &amp; Services</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/subscribe" className="block">
                <Button variant="outline" className="w-full justify-between rounded-xl text-xs">
                  <span>Manage Listing Subscription</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
