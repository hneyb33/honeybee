"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import type {
  AdStatusBucket,
  BookingChannelBucket,
  MediaPipelineBucket,
} from "@/lib/admin/analytics";
import {
  adStatusTotals,
  bookingChannelTotals,
  mediaPipelineTotals,
} from "@/lib/admin/analytics";

const AD_STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  pending: "#f59e0b",
  published: "#22c55e",
  rejected: "#ef4444",
  expired: "#a78bfa",
};

const CHANNEL_COLORS: Record<string, string> = {
  web: "#5b82ff",
  whatsapp: "#22c55e",
  telegram: "#0ea5e9",
};

const PIPELINE_COLORS = {
  ready: "#22c55e",
  processing: "#5b82ff",
  pending: "#f59e0b",
  failed: "#ef4444",
};

export function AdsStatusDonut({
  buckets,
  loading,
}: {
  buckets: AdStatusBucket[];
  loading?: boolean;
}) {
  const data = adStatusTotals(buckets);
  return (
    <AdminCard title="Ads by status" description="Distribution of ad placements">
      {loading ? (
        <Placeholder />
      ) : data.length === 0 ? (
        <Placeholder message="No ads yet." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={AD_STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.35)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminCard>
  );
}

export function BookingChannelPie({
  buckets,
  loading,
}: {
  buckets: BookingChannelBucket[];
  loading?: boolean;
}) {
  const data = bookingChannelTotals(buckets);
  return (
    <AdminCard title="Booking channels" description="Web vs WhatsApp vs Telegram">
      {loading ? (
        <Placeholder />
      ) : data.length === 0 ? (
        <Placeholder message="No bookings yet." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CHANNEL_COLORS[entry.name] ?? "#5b82ff"}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.35)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminCard>
  );
}

export function MediaPipelineBars({
  buckets,
  loading,
}: {
  buckets: MediaPipelineBucket[];
  loading?: boolean;
}) {
  const data = mediaPipelineTotals(buckets);
  return (
    <AdminCard title="Media pipeline" description="Rows by provider and processing status">
      {loading ? (
        <Placeholder />
      ) : data.length === 0 ? (
        <Placeholder message="No media tracked." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="provider" tick={{ fontSize: 11 }} stroke="currentColor" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" width={40} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.35)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ready" stackId="a" fill={PIPELINE_COLORS.ready} radius={[4, 4, 0, 0]} />
              <Bar dataKey="processing" stackId="a" fill={PIPELINE_COLORS.processing} />
              <Bar dataKey="pending" stackId="a" fill={PIPELINE_COLORS.pending} />
              <Bar dataKey="failed" stackId="a" fill={PIPELINE_COLORS.failed} radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminCard>
  );
}

function Placeholder({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-xs text-muted-foreground dark:bg-neutral-800/60">
      {message}
    </div>
  );
}
