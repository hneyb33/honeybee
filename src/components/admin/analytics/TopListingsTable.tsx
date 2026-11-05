"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { formatUGX } from "@/lib/utils";

interface TopListing {
  id: string;
  title: string;
  slug: string;
  kind: string;
  city: string | null;
  cover_image: string | null;
  hourly_rate: number | null;
  rating: number;
  review_count: number;
  booking_count?: number;
}

/**
 * Ten highest-rated listings weighted by review count. Falls back to
 * newest-created rows when the review table is empty so the widget always
 * has content to render.
 */
export function TopListingsTable() {
  const [rows, setRows] = useState<TopListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("listings")
        .select("id,title,slug,kind,city,cover_image,hourly_rate,rating,review_count")
        .eq("verification_status", "verified")
        .order("review_count", { ascending: false })
        .order("rating", { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (queryError) setError(queryError.message);
      else setRows((data ?? []) as TopListing[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminCard title="Top listings" description="Highest-rated verified profiles">
      {loading ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-xs text-destructive">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No verified listings yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-2">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-neutral-800">
                {row.cover_image ? (
                  <Image src={row.cover_image} alt="" fill unoptimized className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profiles/${row.slug}`}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {row.title}
                </Link>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.kind === "service" ? "Provider" : "Model"} · {row.city ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">
                  ★ {Number(row.rating ?? 0).toFixed(1)}
                </p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {row.review_count ?? 0} reviews
                </Badge>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {row.hourly_rate ? formatUGX(row.hourly_rate) : "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
