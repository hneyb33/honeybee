"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { SignupPoint } from "@/lib/admin/analytics";
import { pivotSignups } from "@/lib/admin/analytics";

const KIND_COLORS: Record<string, string> = {
  client: "#5b82ff",
  model: "#f3a94c",
  specialist: "#c63843",
  agency: "#22c55e",
  admin: "#a855f7",
};

export function SignupsStackedBarChart({
  data,
  loading,
}: {
  data: SignupPoint[];
  loading?: boolean;
}) {
  const pivoted = pivotSignups(data);
  const kinds = Array.from(new Set(data.map((row) => row.account_kind)));

  return (
    <AdminCard title="Signups" description="New profiles per day, stacked by account kind">
      {loading ? (
        <Placeholder />
      ) : pivoted.length === 0 ? (
        <Placeholder message="No signups in the selected range." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pivoted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" width={40} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.35)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {kinds.map((kind) => (
                <Bar
                  key={kind}
                  dataKey={kind}
                  stackId="signups"
                  fill={KIND_COLORS[kind] ?? "#94a3b8"}
                  radius={[4, 4, 0, 0]}
                />
              ))}
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
