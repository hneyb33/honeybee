import { MEDIA_POLICY } from "@/lib/media-policy";
import type { AdCategory, AdType, FeaturedTier } from "@/lib/supabase/types";

/**
 * Configuration for the Post Ad wizard - the Fast / Independent / Agency gateway
 * that feeds the admin advertising module. An ad is self-contained: it carries
 * its own content, media, location, contact and placement window, independent of
 * any provider profile.
 */

export const AD_STEPS = ["Your ad", "Photos & video", "Location & contact", "Duration & review"];

export const AD_STEP_HINTS: Record<number, string> = {
  0: "Write what you are promoting. This is what readers see first.",
  1: "Add original photos or a short clip. Uploads start as soon as you pick a file.",
  2: "Where the offer is and how people reach you. Contact is only shown on the ad.",
  3: "Pick how long the ad runs, check the price snapshot, then submit for review.",
};

export interface AdTypeOption {
  id: AdType;
  label: string;
  blurb: string;
  defaultDays: number;
  tier: FeaturedTier;
}

/**
 * Each gateway defaults to a placement window. Fast ads are short and punchy;
 * independent and agency ads run longer and may carry links and a richer about.
 */
export const AD_TYPES: AdTypeOption[] = [
  {
    id: "fast",
    label: "Fast ad",
    blurb: "A short, high-visibility placement for an announcement, event or quick offer.",
    defaultDays: 3,
    tier: "premium",
  },
  {
    id: "independent",
    label: "Independent ad",
    blurb: "A detailed, longer-running ad for an individual service or business.",
    defaultDays: 30,
    tier: "premium",
  },
  {
    id: "agency",
    label: "Agency ad",
    blurb: "Everything an independent ad offers, for agencies promoting multiple services.",
    defaultDays: 60,
    tier: "vip",
  },
];

export const AD_CATEGORIES: { value: AdCategory; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "event", label: "Event" },
  { value: "business", label: "Business" },
  { value: "service", label: "Service" },
  { value: "companion", label: "Companion" },
];

export interface AdFormLink {
  label: string;
  url: string;
}

export interface AdForm {
  title: string;
  category: AdCategory;
  summaryLine: string;
  description: string;
  city: string;
  neighborhood: string;
  country: string;
  whatsappCode: string;
  whatsappNumber: string;
  telegram: string;
  links: AdFormLink[];
  durationDays: number;
}

export function emptyAdForm(type: AdTypeOption): AdForm {
  return {
    title: "",
    category: type.id === "fast" ? "announcement" : "service",
    summaryLine: "",
    description: "",
    city: "Kampala",
    neighborhood: "",
    country: "Uganda",
    whatsappCode: "+256",
    whatsappNumber: "",
    telegram: "",
    links: [],
    durationDays: type.defaultDays,
  };
}

/** One line of guidance for the media step, derived from the shared policy. */
export const AD_MEDIA_HINT = [
  `Up to ${MEDIA_POLICY.photo.maxCount} ${MEDIA_POLICY.photo.unitLabel} (${Math.round(MEDIA_POLICY.photo.uploadBudgetBytes / 1_000_000)} MB each).`,
  `Up to ${MEDIA_POLICY.video.maxCount} ${MEDIA_POLICY.video.unitLabel} (${Math.round(MEDIA_POLICY.video.uploadBudgetBytes / 1_000_000)} MB, ${((MEDIA_POLICY.video.maxDurationSeconds ?? 0) / 60)} minutes).`,
  "Only upload media you have permission to publish.",
].join(" ");

export function adTypeOption(type: AdType): AdTypeOption {
  return AD_TYPES.find((option) => option.id === type) ?? AD_TYPES[0];
}

export function safeAdSlug(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "honeybee-ad"}-${crypto.randomUUID().slice(0, 8)}`;
}
