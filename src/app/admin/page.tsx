"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Megaphone,
  RefreshCw,
  Sprout,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/AdminStatCard";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { Button } from "@/components/ui/button";
import { RevenueAreaChart } from "@/components/admin/analytics/RevenueAreaChart";
import { SignupsStackedBarChart } from "@/components/admin/analytics/SignupsStackedBarChart";
import { AdsStatusDonut } from "@/components/admin/analytics/DistributionCharts";
import { VerificationFunnelChart } from "@/components/admin/analytics/VerificationFunnelChart";
import { rollupRevenue, useAnalytics, useVerificationFunnel } from "@/lib/admin/analytics";
import { fetchAuditLog, type AdminAuditRow } from "@/lib/admin/queries";
import { useAdminSession } from "@/lib/admin/session";

/**
 * Dashboard home: current-state KPIs, the three headline charts, the
 * verification funnel, jump links into every busy queue, and the most recent
 * admin activity. Deep metrics live on /admin/analytics.
 */
export default function AdminDashboardPage() {
  const { profile } = useAdminSession();
  const router = useRouter();
  const analytics = useAnalytics("30d");
  const funnel = useVerificationFunnel();
  const [activity, setActivity] = useState<AdminAuditRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const revenue = useMemo(() => rollupRevenue(analytics.revenue), [analytics.revenue]);

  const loadActivity = async () => {
    setActivityLoading(true);
    const result = await fetchAuditLog({ pageSize: 8 });
    setActivity(result.rows as AdminAuditRow[]);
    setActivityLoading(false);
  };

  useEffect(() => {
    void loadActivity();
  }, []);

  const { totals } = analytics;
  const queues = [
    {
      label: "Profiles to review",
      count: totals.pendingListings,
      href: "/admin/verifications",
      icon: UserCheck,
    },
    {
      label: "Payments waiting",
      count: totals.pendingPayments,
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      label: "Ads awaiting approval",
      count: totals.pendingAds,
      href: "/admin/ads?status=pending",
      icon: Megaphone,
    },
    {
      label: "Open flags",
      count: totals.openFlags,
      href: "/admin/flags",
      icon: Sprout,
    },
  ].filter((queue) => queue.count > 0);

  return (
    <AdminRoute
      eyebrow={`Welcome back, ${profile?.name ?? "Admin"}`}
      title="Platform overview"
      description="Live snapshot of the marketplace, moderation load and revenue."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl"
          onClick={() => {
            void analytics.reload();
            void funnel.reload();
            void loadActivity();
          }}
        >
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      }
    >
      {analytics.error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {analytics.error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Models" value={totals.models.toLocaleString()} icon={UserRound} tone="teal" />
        <AdminStatCard label="Providers" value={totals.providers.toLocaleString()} icon={Building2} tone="rose" />
        <AdminStatCard label="Clients" value={totals.clients.toLocaleString()} icon={Users} tone="sky" />
        <AdminStatCard
          label="Pending profiles"
          value={totals.pendingListings.toLocaleString()}
          icon={UserCheck}
          tone="amber"
          hint="Awaiting verification"
          onClick={() => router.push("/admin/verifications")}
        />
        <AdminStatCard
          label="Payments waiting"
          value={totals.pendingPayments.toLocaleString()}
          icon={CreditCard}
          tone="violet"
          onClick={() => router.push("/admin/payments")}
        />
        <AdminStatCard
          label="Published ads"
          value={totals.publishedAds.toLocaleString()}
          icon={Megaphone}
          tone="emerald"
          hint={`${totals.pendingAds} awaiting approval`}
        />
      </div>

      {queues.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queues.map((queue) => (
            <Link
              key={queue.href}
              href={queue.href}
              className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <span className="flex items-center gap-2">
                <queue.icon className="h-4 w-4" />
                {queue.label}
              </span>
              <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-xs font-extrabold dark:bg-amber-900/60">
                {queue.count}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RevenueAreaChart data={revenue} loading={analytics.loading} />
        <VerificationFunnelChart counts={funnel.counts} loading={funnel.loading} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SignupsStackedBarChart data={analytics.signups} loading={analytics.loading} />
        <AdsStatusDonut buckets={analytics.adStatus} loading={analytics.loading} />
      </div>

      <div className="mt-5">
        <AdminCard
          title="Recent admin activity"
          description="Latest entries from the audit log."
          actions={
            <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
              <Link href="/admin/audit">Open audit log</Link>
            </Button>
          }
        >
          {activityLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading activity…</p>
          ) : activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No admin actions recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-semibold">{entry.actor?.name ?? "System"}</span>{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">
                        {entry.action}
                      </code>{" "}
                      <span className="capitalize text-muted-foreground">{entry.entity}</span>
                    </p>
                    {entry.reason ? (
                      <p className="truncate text-[11px] text-muted-foreground">{entry.reason}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {relativeTime(entry.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </AdminRoute>
  );
}

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
