"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type AnalyticsRange = "30d" | "90d" | "all";

export interface RevenuePoint {
  day: string;
  total: number;
  payments: number;
}

export interface SignupPoint {
  day: string;
  account_kind: string;
  signups: number;
}

export interface AdStatusBucket {
  status: string;
  payment_status: string;
  is_featured: boolean;
  count: number;
}

export interface BookingChannelBucket {
  channel: string;
  status: string;
  count: number;
}

export interface MediaPipelineBucket {
  storage_provider: string;
  processing_status: string;
  count: number;
}

export interface AnalyticsSummary {
  totals: {
    models: number;
    providers: number;
    clients: number;
    agencies: number;
    pendingListings: number;
    pendingPayments: number;
    pendingAds: number;
    publishedAds: number;
    openFlags: number;
  };
  revenue: RevenuePoint[];
  signups: SignupPoint[];
  adStatus: AdStatusBucket[];
  bookingChannels: BookingChannelBucket[];
  mediaPipeline: MediaPipelineBucket[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: string | null;
  reload: () => Promise<void>;
}

function rangeStart(range: AnalyticsRange): string | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/**
 * Loads every aggregate the admin analytics page and dashboard need. Views
 * are pre-aggregated server-side (see migration 20261105000000) so a single
 * page visit issues at most ~10 lightweight queries.
 */
export function useAnalytics(range: AnalyticsRange): AnalyticsSummary {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const [totals, setTotals] = useState<AnalyticsSummary["totals"]>({
    models: 0,
    providers: 0,
    clients: 0,
    agencies: 0,
    pendingListings: 0,
    pendingPayments: 0,
    pendingAds: 0,
    publishedAds: 0,
    openFlags: 0,
  });
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [signups, setSignups] = useState<SignupPoint[]>([]);
  const [adStatus, setAdStatus] = useState<AdStatusBucket[]>([]);
  const [bookingChannels, setBookingChannels] = useState<BookingChannelBucket[]>([]);
  const [mediaPipeline, setMediaPipeline] = useState<MediaPipelineBucket[]>([]);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Configure Supabase to load analytics.");
      return;
    }
    setLoading(true);
    setError(null);
    const from = rangeStart(range);

    const withRange = <T extends { day: string }>(rows: T[]) =>
      from ? rows.filter((row) => row.day >= from.slice(0, 10)) : rows;

    const [
      modelsRes,
      providersRes,
      clientsRes,
      agenciesRes,
      pendingListingsRes,
      pendingPaymentsRes,
      pendingAdsRes,
      publishedAdsRes,
      openFlagsRes,
      revenueRes,
      signupsRes,
      adStatusRes,
      bookingRes,
      mediaRes,
    ] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("kind", "escort"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("kind", "service"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_kind", "client"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_kind", "agency"),
      supabase.from("listings").select("id", { count: "exact", head: true }).in("verification_status", ["pending", "under_review"]),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("admin_flags").select("id", { count: "exact", head: true }).is("resolved_at", null),
      supabase.from("admin_v_revenue_daily").select("day,total,payments").order("day", { ascending: true }).limit(500),
      supabase.from("admin_v_signups_daily").select("day,account_kind,signups").order("day", { ascending: true }).limit(500),
      supabase.from("admin_v_ad_status").select("status,payment_status,is_featured,count"),
      supabase.from("admin_v_booking_channels").select("channel,status,count"),
      supabase.from("admin_v_media_pipeline").select("storage_provider,processing_status,count"),
    ]);

    const firstError =
      modelsRes.error ?? providersRes.error ?? clientsRes.error ?? agenciesRes.error ??
      pendingListingsRes.error ?? pendingPaymentsRes.error ?? pendingAdsRes.error ??
      publishedAdsRes.error ?? openFlagsRes.error ?? revenueRes.error ??
      signupsRes.error ?? adStatusRes.error ?? bookingRes.error ?? mediaRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setTotals({
      models: modelsRes.count ?? 0,
      providers: providersRes.count ?? 0,
      clients: clientsRes.count ?? 0,
      agencies: agenciesRes.count ?? 0,
      pendingListings: pendingListingsRes.count ?? 0,
      pendingPayments: pendingPaymentsRes.count ?? 0,
      pendingAds: pendingAdsRes.count ?? 0,
      publishedAds: publishedAdsRes.count ?? 0,
      openFlags: openFlagsRes.count ?? 0,
    });
    setRevenue(withRange((revenueRes.data ?? []) as RevenuePoint[]));
    setSignups(withRange((signupsRes.data ?? []) as SignupPoint[]));
    setAdStatus((adStatusRes.data ?? []) as AdStatusBucket[]);
    setBookingChannels((bookingRes.data ?? []) as BookingChannelBucket[]);
    setMediaPipeline((mediaRes.data ?? []) as MediaPipelineBucket[]);
    setLastLoadedAt(new Date().toISOString());
    setLoading(false);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      totals,
      revenue,
      signups,
      adStatus,
      bookingChannels,
      mediaPipeline,
      loading,
      error,
      lastLoadedAt,
      reload: load,
    }),
    [totals, revenue, signups, adStatus, bookingChannels, mediaPipeline, loading, error, lastLoadedAt, load],
  );
}

/**
 * Verification funnel counts for the dashboard + analytics charts. Independent
 * of the analytics range (funnel depth is a current-state snapshot).
 */
export function useVerificationFunnel(): {
  counts: { pending: number; underReview: number; verified: number; rejected: number };
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [counts, setCounts] = useState({ pending: 0, underReview: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [pending, underReview, verified, rejected] = await Promise.all([
      countOf("listings", "verification_status", "pending"),
      countOf("listings", "verification_status", "under_review"),
      countOf("listings", "verification_status", "verified"),
      countOf("listings", "verification_status", "rejected"),
    ]);
    setCounts({ pending, underReview, verified, rejected });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { counts, loading, reload: load };
}

async function countOf(table: string, column: string, value: string): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  return count ?? 0;
}

/** Aggregates revenue rows into daily totals (chart-friendly). */
export function rollupRevenue(points: RevenuePoint[]): RevenuePoint[] {
  const map = new Map<string, RevenuePoint>();
  for (const p of points) {
    const existing = map.get(p.day);
    if (existing) {
      existing.total += p.total;
      existing.payments += p.payments;
    } else {
      map.set(p.day, { ...p });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
}

/** Converts signup rows into a pivoted shape (one row per day, one key per kind). */
export function pivotSignups(points: SignupPoint[]): Array<Record<string, number | string>> {
  const kinds = Array.from(new Set(points.map((p) => p.account_kind))).sort();
  const map = new Map<string, Record<string, number | string>>();
  for (const p of points) {
    const row = map.get(p.day) ?? { day: p.day };
    row[p.account_kind] = p.signups;
    map.set(p.day, row);
  }
  const rows = Array.from(map.values()).sort((a, b) => (String(a.day) < String(b.day) ? -1 : 1));
  return rows.map((row) => {
    const filled: Record<string, number | string> = { day: row.day };
    for (const kind of kinds) filled[kind] = Number(row[kind] ?? 0);
    return filled;
  });
}

/** Buckets ads by their moderation status for a pie/donut chart. */
export function adStatusTotals(buckets: AdStatusBucket[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const b of buckets) map.set(b.status, (map.get(b.status) ?? 0) + b.count);
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function bookingChannelTotals(buckets: BookingChannelBucket[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const b of buckets) map.set(b.channel, (map.get(b.channel) ?? 0) + b.count);
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function mediaPipelineTotals(buckets: MediaPipelineBucket[]): Array<{ provider: string; ready: number; processing: number; failed: number; pending: number }> {
  const map = new Map<string, { provider: string; ready: number; processing: number; failed: number; pending: number }>();
  for (const b of buckets) {
    const entry = map.get(b.storage_provider) ?? {
      provider: b.storage_provider,
      ready: 0,
      processing: 0,
      failed: 0,
      pending: 0,
    };
    if (b.processing_status === "ready") entry.ready += b.count;
    else if (b.processing_status === "processing") entry.processing += b.count;
    else if (b.processing_status === "failed") entry.failed += b.count;
    else entry.pending += b.count;
    map.set(b.storage_provider, entry);
  }
  return Array.from(map.values());
}
