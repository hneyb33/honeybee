"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { RevenuePoint } from "@/lib/admin/analytics";

/**
 * Renders daily verified-payment totals as a soft area chart. The parent is
 * responsible for rolling up duplicate days via `rollupRevenue` first.
 */
export function RevenueAreaChart({
  data,
  loading,
}: {
  data: RevenuePoint[];
  loading?: boolean;
}) {
  const formatted = data.map((row) => ({
    ...row,
    label: new Date(row.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <AdminCard title="Revenue" description="Daily verified payment totals (UGX)">
      {loading ? (
        <ChartPlaceholder />
      ) : formatted.length === 0 ? (
        <ChartPlaceholder message="No verified payments in the selected range." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b82ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#5b82ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" width={64} />
              <Tooltip
                formatter={(value: number | string) => Number(value).toLocaleString()}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.35)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#5b82ff"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminCard>
  );
}

function ChartPlaceholder({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-xs text-muted-foreground dark:bg-neutral-800/60">
      {message}
    </div>
  );
}
