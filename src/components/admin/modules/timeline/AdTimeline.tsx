"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw, Star } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { adsMutations } from "@/lib/admin/mutations";
import { fetchAds, type AdminAdRow } from "@/lib/admin/queries";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";
import { getMediaImageUrl } from "@/lib/media-urls";

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 30;
const LOOKAHEAD_DAYS = 45;

interface TimelineWindow {
  from: number;
  to: number;
  span: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pct(timestamp: number, window: TimelineWindow): number {
  return ((clamp(timestamp, window.from, window.to) - window.from) / window.span) * 100;
}

/**
 * Horizontal placement calendar for ads: one bar per campaign across a
 * ~75-day window. Bars respect `starts_at`/`ends_at`; open-ended campaigns
 * run to the right edge. Moderators can shift an end date directly from the
 * bar via the audited `admin_set_ad_placement` RPC.
 */
export function AdTimeline() {
  const { role } = useAdminSession();
  const canModerate = can(role, "ads.moderate");
  const [rows, setRows] = useState<AdminAdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAds({ pageSize: 100 });
    setRows(result.rows as AdminAdRow[]);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const view = useMemo<TimelineWindow>(() => {
    const from = now - LOOKBACK_DAYS * DAY_MS;
    const to = now + LOOKAHEAD_DAYS * DAY_MS;
    return { from, to, span: to - from };
  }, [now]);

  const visible = useMemo(() => {
    const parsed = rows
      .map((row) => ({
        row,
        start: Date.parse(row.starts_at),
        end: row.ends_at ? Date.parse(row.ends_at) : null,
      }))
      .filter(({ row, start, end }) => {
        if (Number.isNaN(start)) return false;
        if (!showAll && row.status !== "published" && row.status !== "pending") return false;
        // Drop campaigns that ended before the window opens.
        return end === null || end >= view.from;
      })
      .sort((a, b) => a.start - b.start);
    return parsed;
  }, [rows, showAll, view]);

  const tickMarks = useMemo(() => {
    const ticks: Array<{ label: string; position: number }> = [];
    const cursor = new Date(view.from);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor.getTime() <= view.to) {
      const time = cursor.getTime();
      ticks.push({
        label: cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        position: ((time - view.from) / view.span) * 100,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return ticks;
  }, [view]);

  const extend = async (ad: AdminAdRow) => {
    const input = window.prompt(
      `New end date for "${ad.title}" (YYYY-MM-DD, blank = ongoing)`,
      ad.ends_at?.slice(0, 10) ?? "",
    );
    if (input === null) return;
    const trimmed = input.trim();
    if (trimmed && Number.isNaN(Date.parse(`${trimmed}T23:59:59Z`))) {
      setError("Enter a valid date like 2026-12-31, or leave blank for ongoing.");
      return;
    }
    setBusyId(ad.id);
    const result = await adsMutations.setPlacement({
      adId: ad.id,
      featured: ad.is_featured,
      tier: ad.featured_tier,
      startsAt: ad.starts_at,
      endsAt: trimmed ? `${trimmed}T23:59:59Z` : null,
    });
    if (!result.ok) setError(result.error ?? "Update failed.");
    else await load();
    setBusyId(null);
  };

  const todayPosition = pct(now, view);

  return (
    <AdminCard
      title="Ad placement timeline"
      description={`Campaign windows over the last ${LOOKBACK_DAYS} and next ${LOOKAHEAD_DAYS} days.`}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? "Published + pending only" : "Show every status"}
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{new Date(view.from).toLocaleDateString()}</span>
        <span>Today</span>
        <span>{new Date(view.to).toLocaleDateString()}</span>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading campaigns…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No campaigns inside this window. Create one from the Ads page.
        </p>
      ) : (
        <div className="relative space-y-2">
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[#c63843]/60"
            style={{ left: `${todayPosition}%` }}
            aria-hidden
          />
          {visible.map(({ row, start, end }) => {
            const left = pct(start, view);
            const right = end === null ? 100 : pct(end, view);
            const width = Math.max(1.5, right - left);
            const ended = end !== null && end < now;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[minmax(140px,220px)_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-[minmax(180px,260px)_1fr]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-neutral-800">
                    {row.cover_image ? (
                      <Image
                        src={getMediaImageUrl({ url: row.cover_image }, "card") || row.cover_image}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.title}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <AdminStatusBadge status={row.status} />
                      {row.is_featured ? (
                        <span className="inline-flex items-center text-amber-600">
                          <Star className="h-3 w-3 fill-current" /> {row.featured_tier}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="relative h-8">
                  <button
                    type="button"
                    disabled={!canModerate || busyId === row.id}
                    onClick={() => void extend(row)}
                    title={`${new Date(start).toLocaleDateString()} → ${
                      end ? new Date(end).toLocaleDateString() : "ongoing"
                    } (click to change window)`}
                    className={`absolute top-1/2 flex h-6 -translate-y-1/2 items-center justify-end overflow-hidden rounded-full px-2 text-[10px] font-bold text-white transition ${
                      ended ? "bg-slate-400/70 dark:bg-neutral-600" : row.is_featured ? "bg-amber-500" : "bg-[#5b82ff]"
                    } ${canModerate ? "cursor-pointer hover:brightness-110" : "cursor-default"} disabled:opacity-60`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="truncate">
                      {end
                        ? `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} → ${new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                        : `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} → ongoing`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-muted-foreground dark:border-neutral-800">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{tickMarks.length} weekly markers · bar click edits the window (audited)</span>
      </div>
    </AdminCard>
  );
}
