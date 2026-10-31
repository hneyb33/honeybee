import type { Ad, AdCategory, AdLink, AdStatus, AdType, FeaturedTier } from "@/lib/supabase/types";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const AD_TYPES: AdType[] = ["fast", "independent", "agency"];
const AD_CATEGORIES: AdCategory[] = ["announcement", "event", "business", "service", "companion"];
const AD_STATUSES: AdStatus[] = ["draft", "pending", "published", "rejected", "expired"];
const FEATURED_TIERS: FeaturedTier[] = ["premium", "vip"];

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function mapLinks(value: unknown): AdLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const url = text(record.url);
      if (!url) return null;
      return { label: text(record.label) || url, url };
    })
    .filter((item): item is AdLink => item !== null);
}

/**
 * Maps a raw `ads` row into an `Ad`. Media images and cover come from the
 * `ad_media` table (resolved separately by the caller) because, unlike a
 * listing, an ad has no inline `images` column.
 */
export function mapAdRow(
  row: Record<string, unknown>,
  mediaImages?: string[],
  mediaCoverImage?: string
): Ad {
  const status = oneOf(row.status, AD_STATUSES, "draft");
  const endsAt = nullableText(row.ends_at);
  const startsAt = text(row.starts_at);
  const isActive =
    status === "published" &&
    (!endsAt || Date.parse(endsAt) > Date.now()) &&
    (!startsAt || Date.parse(startsAt) <= Date.now());

  return {
    id: text(row.id),
    user_id: nullableText(row.user_id) ?? undefined,
    source_listing_id: nullableText(row.source_listing_id) ?? undefined,
    ad_type: oneOf(row.ad_type, AD_TYPES, "independent"),
    title: text(row.title),
    slug: text(row.slug),
    category: oneOf(row.category, AD_CATEGORIES, "service"),
    summary_line: text(row.summary_line),
    description: text(row.description),
    city: text(row.city) || undefined,
    neighborhood: text(row.neighborhood) || undefined,
    country: text(row.country, "Uganda"),
    contact_whatsapp_code: text(row.contact_whatsapp_code) || undefined,
    contact_whatsapp_number: text(row.contact_whatsapp_number) || undefined,
    contact_telegram: text(row.contact_telegram) || undefined,
    links: mapLinks(row.links),
    cover_image: mediaCoverImage || text(row.cover_image),
    images: mediaImages?.length ? mediaImages : [],
    starts_at: startsAt,
    ends_at: endsAt,
    is_featured: Boolean(row.is_featured) && isActive,
    featured_tier:
      Boolean(row.is_featured) && isActive
        ? oneOf(row.featured_tier, FEATURED_TIERS, "premium")
        : null,
    status,
    moderation_notes: nullableText(row.moderation_notes),
    amount: numberOr(row.amount, 0),
    currency: text(row.currency, "UGX"),
    payment_status: oneOf(row.payment_status, ["unpaid", "submitted", "verified", "rejected"] as const, "unpaid"),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
    is_active: isActive,
  };
}
