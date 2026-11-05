"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { Button } from "@/components/ui/button";
import { RevenueAreaChart } from "@/components/admin/analytics/RevenueAreaChart";
import { SignupsStackedBarChart } from "@/components/admin/analytics/SignupsStackedBarChart";
import {
  AdsStatusDonut,
  BookingChannelPie,
  MediaPipelineBars,
} from "@/components/admin/analytics/DistributionCharts";
import { VerificationFunnelChart } from "@/components/admin/analytics/VerificationFunnelChart";
import { TopListingsTable } from "@/components/admin/analytics/TopListingsTable";
import {
  rollupRevenue,
  useAnalytics,
  useVerificationFunnel,
  type AnalyticsRange,
} from "@/lib/admin/analytics";

const RANGES: AnalyticsRange[] = ["30d", "90d", "all"];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("90d");
  const analytics = useAnalytics(range);
  const funnel = useVerificationFunnel();
  const revenue = useMemo(() => rollupRevenue(analytics.revenue), [analytics.revenue]);

  const verifiedTotal = revenue.reduce((sum, point) => sum + point.total, 0);

  return (
    <AdminRoute
      eyebrow="Intelligence"
      title="Analytics"
      description="Revenue, growth, moderation throughput and pipeline depth across the platform."
      requiredCapability="analytics.view"
      actions={
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                range === option
                  ? "bg-[#5b82ff] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === "all" ? "All time" : option}
            </button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-lg"
            onClick={() => {
              void analytics.reload();
              void funnel.reload();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      {analytics.error ? (
        <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {analytics.error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <RevenueAreaChart data={revenue} loading={analytics.loading} />
        <SignupsStackedBarChart data={analytics.signups} loading={analytics.loading} />
        <AdsStatusDonut buckets={analytics.adStatus} loading={analytics.loading} />
        <VerificationFunnelChart counts={funnel.counts} loading={funnel.loading} />
        <BookingChannelPie buckets={analytics.bookingChannels} loading={analytics.loading} />
        <MediaPipelineBars buckets={analytics.mediaPipeline} loading={analytics.loading} />
      </div>

      <div className="mt-5">
        <TopListingsTable />
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        {verifiedTotal.toLocaleString()} UGX verified in range
        {analytics.lastLoadedAt ? ` · refreshed ${new Date(analytics.lastLoadedAt).toLocaleTimeString()}` : ""}
      </p>
    </AdminRoute>
  );
}
