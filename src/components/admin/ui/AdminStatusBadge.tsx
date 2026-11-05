import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  accent: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
};

const STATUS_TONES: Record<string, Tone> = {
  // Listing / verification
  draft: "neutral",
  pending: "warning",
  under_review: "info",
  verified: "success",
  rejected: "danger",
  suspended: "danger",
  // Ads
  published: "success",
  expired: "neutral",
  // Payments
  submitted: "info",
  paid: "success",
  unpaid: "neutral",
  // Subscriptions
  active: "success",
  cancelled: "danger",
  // Media pipeline
  ready: "success",
  processing: "info",
  failed: "danger",
  // Flags
  review: "info",
  abuse: "danger",
  fraud: "danger",
  quality: "warning",
  legal: "danger",
  // Roles
  super_admin: "accent",
  moderator: "info",
  client_free: "neutral",
  client_premium: "accent",
  provider_free: "neutral",
  provider_premium: "accent",
  // Account kinds
  client: "info",
  model: "accent",
  specialist: "warning",
  agency: "success",
  admin: "accent",
};

export function AdminStatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status: string | null | undefined;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const key = status ?? "";
  const effective = tone ?? STATUS_TONES[key] ?? "neutral";
  const text = label ?? (key ? key.replace(/_/g, " ") : "Unknown");
  return (
    <Badge variant="outline" className={cn("capitalize", TONE_CLASSES[effective], className)}>
      {text}
    </Badge>
  );
}
