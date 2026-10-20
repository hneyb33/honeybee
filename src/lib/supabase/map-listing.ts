import { Listing, ProfileOffering } from "@/lib/supabase/types";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function mapListingRow(
  row: Record<string, unknown>,
  mediaImages?: string[],
  offerings?: ProfileOffering[]
): Listing {
  const images = mediaImages?.length ? mediaImages : strings(row.images);
  const details =
    row.profile_details && typeof row.profile_details === "object"
      ? (row.profile_details as Listing["profile_details"])
      : {};
  const featuredUntil = text(row.featured_until) || null;
  const featuredActive =
    Boolean(row.is_featured) &&
    (!featuredUntil || Date.parse(featuredUntil) > Date.now());

  return {
    id: text(row.id),
    user_id: text(row.user_id) || undefined,
    title: text(row.title),
    slug: text(row.slug),
    kind: row.kind === "service" ? "service" : "escort",
    escort_tier: row.escort_tier === "vip" || row.escort_tier === "premium" ? row.escort_tier : "standard",
    service_type: text(row.service_type) || undefined,
    category: text(row.category, "service"),
    age: typeof row.age === "number" ? row.age : undefined,
    gender: text(row.gender) || undefined,
    ethnicity: text(row.ethnicity) || undefined,
    nationality: text(row.nationality) || undefined,
    city: text(row.city, "Kampala"),
    neighborhood: text(row.neighborhood, "Central"),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    hourly_rate: row.kind === "service" ? Number(row.hourly_rate ?? 0) : 0,
    monthly_price: row.kind === "service" && row.monthly_price != null ? Number(row.monthly_price) : undefined,
    currency: text(row.currency, "UGX"),
    summary_line: text(row.summary_line),
    description: text(row.description),
    about_me: text(row.about_me) || undefined,
    services_offered: strings(row.services_offered),
    languages: strings(row.languages),
    rates: row.rates && typeof row.rates === "object" ? row.rates as Record<string, string> : undefined,
    availability: Array.isArray(row.availability) ? row.availability : [],
    verification_status: "verified",
    verification_notes: text(row.verification_notes) || undefined,
    rating: Number(row.rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    whatsapp_number: text(row.whatsapp_number) || undefined,
    whatsapp_code: text(row.whatsapp_code) || undefined,
    telegram: text(row.telegram) || undefined,
    telegram_code: text(row.telegram_code) || undefined,
    cover_image: text(row.cover_image) || images[0] || "",
    images,
    is_featured: featuredActive,
    featured_tier: featuredActive && (row.featured_tier === "vip" || row.featured_tier === "premium")
      ? row.featured_tier
      : null,
    featured_until: featuredUntil,
    last_seen_at: text(row.last_seen_at) || null,
    advertiser_type:
      row.advertiser_type === "fast" ||
      row.advertiser_type === "independent" ||
      row.advertiser_type === "agency"
        ? row.advertiser_type
        : undefined,
    experience_band: text(row.experience_band) || undefined,
    has_certificate: Boolean(row.has_certificate),
    certificate_url: text(row.certificate_url) || undefined,
    travel_km: text(row.travel_km) || undefined,
    profile_details: details,
    offerings,
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
  };
}
