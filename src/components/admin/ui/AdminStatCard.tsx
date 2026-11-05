import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "teal" | "rose" | "sky" | "amber" | "violet" | "emerald" | "slate";

const TONES: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300",
};

/**
 * Compact KPI tile with a colored icon, headline value, optional delta and
 * optional sparkline slot. `delta` is a signed number rendered with a
 * directional arrow and tone color.
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  hint,
  delta,
  sparkline,
  onClick,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: ReactNode;
  delta?: number;
  sparkline?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Wrapper: React.ElementType = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight">{value}</p>
        {typeof delta === "number" && delta !== 0 ? (
          <p
            className={cn(
              "mt-1 text-xs font-semibold",
              delta > 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toLocaleString()}
          </p>
        ) : null}
        {hint ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex flex-col items-end gap-2">
        {Icon ? (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", TONES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        {sparkline}
      </div>
    </Wrapper>
  );
}
