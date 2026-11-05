"use client";

import { AdminCard } from "@/components/admin/ui/AdminCard";

export interface VerificationFunnelCounts {
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
}

/**
 * Simple horizontal bar funnel of listing verification states. Data comes
 * from a single count query in the caller — no new server view needed.
 */
export function VerificationFunnelChart({
  counts,
  loading,
}: {
  counts: VerificationFunnelCounts;
  loading?: boolean;
}) {
  const steps = [
    { label: "Pending", value: counts.pending, tone: "bg-amber-500" },
    { label: "Under review", value: counts.underReview, tone: "bg-sky-500" },
    { label: "Verified", value: counts.verified, tone: "bg-emerald-500" },
    { label: "Rejected", value: counts.rejected, tone: "bg-rose-500" },
  ];
  const max = Math.max(1, ...steps.map((step) => step.value));

  return (
    <AdminCard title="Verification funnel" description="Listings moving through moderation">
      {loading ? (
        <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{step.label}</span>
                <span className="tabular-nums text-muted-foreground">{step.value.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div
                  className={`h-full ${step.tone} transition-all`}
                  style={{ width: `${(step.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}
