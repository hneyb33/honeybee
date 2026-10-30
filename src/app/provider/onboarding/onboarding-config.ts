import { MEDIA_POLICY } from "@/lib/media-policy";

export const MODEL_STEPS = [
  "About you",
  "Location",
  "Experiences & availability",
  "Portfolio & story",
  "Review",
];
export const SPECIALIST_STEPS = [
  "About you",
  "Location",
  "Services & availability",
  "Portfolio & story",
  "Review",
];

export const STEP_HINTS: Record<number, string> = {
  0: "Choose the public details that help clients recognize and understand your profile.",
  1: "Your neighbourhood and contact number help clients discover and reach you.",
  2: "Pick what you offer and when you are free. Pricing is discussed privately in chat.",
  3: "A clear introduction and original photos build trust. Media uploads start immediately.",
  4: "Check your details. Profiles stay hidden from discovery until an admin verifies them.",
};

/**
 * Models sell on their portfolio, so a clip is part of the product. For home
 * service providers a 90 MB video was the single biggest drop-off point in the
 * wizard, so it is optional there. Flip this to `true` to require a video for
 * every account type.
 */
export const REQUIRES_VIDEO_FOR_MODELS = true;
export const REQUIRES_VIDEO_FOR_SPECIALISTS = true;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const LANGUAGES = ["English", "Luganda", "Swahili", "Runyankole", "Lusoga", "Acholi", "Other"];
export const nationalities = ["Ugandan", "Kenyan", "Rwandan", "Tanzanian", "South Sudanese", "Other"];
export const orientations = ["Straight", "Bi-sexual", "Lesbian", "Gay", "Prefer not to say"];

export const SERVICE_TYPES = [
  { value: "private_chef", label: "Private chef" },
  { value: "home_laundry", label: "Home laundry" },
  { value: "private_massage", label: "Private massage" },
  { value: "other", label: "Other home service" },
];

export const SERVICE_OPTIONS: Record<string, string[]> = {
  private_chef: ["Meal preparation", "Private dining", "Event catering", "Meal planning"],
  home_laundry: ["Wash & fold", "Ironing", "Pickup & delivery", "Wardrobe care"],
  private_massage: ["Relaxation massage", "Deep tissue massage", "Sports recovery", "At-home sessions"],
  other: ["At-home service", "Scheduled appointments", "Custom requests"],
};

export interface OnboardingForm {
  title: string;
  age: string;
  ageConfirmed: boolean;
  gender: string;
  nationality: string;
  country: string;
  city: string;
  neighborhood: string;
  travelKm: string;
  whatsappNumber: string;
  whatsappCode: string;
  telegram: string;
  serviceType: string;
  services: string[];
  languages: string[];
  availableDays: string[];
  from: string;
  to: string;
  description: string;
  yearsExperience: string;
  certified: boolean;
  orientation: string;
  bio: string;
}

export const emptyForm: OnboardingForm = {
  title: "",
  age: "",
  ageConfirmed: false,
  gender: "",
  nationality: "Ugandan",
  country: "Uganda",
  city: "Kampala",
  neighborhood: "",
  travelKm: "10",
  whatsappNumber: "",
  whatsappCode: "+256",
  telegram: "",
  serviceType: "private_chef",
  services: [],
  languages: ["English"],
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  from: "09:00",
  to: "18:00",
  description: "",
  yearsExperience: "",
  certified: false,
  orientation: "",
  bio: "",
};

export type AccountKind = "model" | "specialist" | "agency";
export type AdvertiserType = "fast" | "independent" | "agency";

export function safeSlug(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "honeybee-profile"}-${crypto.randomUUID().slice(0, 8)}`;
}

/** One line of guidance for the portfolio step, derived from the policy. */
export const PORTFOLIO_HINT = [
  "Required: at least 1 photo.",
  `${MEDIA_POLICY.photo.maxCount} ${MEDIA_POLICY.photo.unitLabel} up to ${Math.round(MEDIA_POLICY.photo.uploadBudgetBytes / 1_000_000)} MB each (large photos are resized in your browser first).`,
  `${MEDIA_POLICY.video.maxCount} ${MEDIA_POLICY.video.unitLabel} up to ${Math.round(MEDIA_POLICY.video.uploadBudgetBytes / 1_000_000)} MB and ${(MEDIA_POLICY.video.maxDurationSeconds ?? 0) / 60} minutes.`,
  "Only upload media you have permission to publish.",
].join(" ");
