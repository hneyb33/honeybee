import { getMediaImageUrl, isPublicMediaReady } from "@/lib/media-urls";
import { mapAdRow } from "@/lib/supabase/map-ad";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Ad } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Data access for the `ads` table.
 *
 * The organic directory keeps reading `listings`; only the featured/ad spaces
 * and the standalone ad detail page read published `ads`, so a profile can never
 * leak into an advertising slot.
 */

const AD_MEDIA_SELECT =
  "ad_id,url,kind,sort_order,processing_status,storage_provider,card_url,detail_url,thumbnail_url";

interface AdMediaRow {
  ad_id: string;
  url: string;
  kind: string;
  sort_order: number;
  processing_status?: string;
  storage_provider?: string;
  card_url?: string;
  detail_url?: string;
  thumbnail_url?: string;
}

/**
 * Resolves the ready photo renditions for a batch of ads so cards and covers
 * render at the right size. Videos are omitted from the gallery images; their
 * playback URL is exposed through the detail page instead.
 */
async function attachMedia(
  client: SupabaseClient,
  ads: Ad[]
): Promise<Ad[]> {
  if (ads.length === 0) return ads;
  const ids = ads.map((ad) => ad.id);
  const { data, error } = await client
    .from("ad_media")
    .select(AD_MEDIA_SELECT)
    .in("ad_id", ids)
    .eq("kind", "photo")
    .order("sort_order", { ascending: true });
  if (error || !data) return ads;

  const rows = data as AdMediaRow[];
  const byAd = new Map<string, AdMediaRow[]>();
  for (const row of rows) {
    if (!isPublicMediaReady(row)) continue;
    const bucket = byAd.get(row.ad_id) ?? [];
    bucket.push(row);
    byAd.set(row.ad_id, bucket);
  }

  return ads.map((ad) => {
    const media = byAd.get(ad.id) ?? [];
    const images = media.map((item) => getMediaImageUrl(item, "detail"));
    const cover = media[0] ? getMediaImageUrl(media[0], "card") : "";
    return {
      ...ad,
      images: images.length ? images : ad.images,
      cover_image: cover || ad.cover_image,
    };
  });
}

/** Loads published, currently-active ads. `featuredOnly` limits to admin picks. */
export async function loadActiveAds(
  options: { featuredOnly?: boolean; client?: SupabaseClient } = {}
): Promise<Ad[]> {
  const client = options.client ?? supabase;
  if (!client || !isSupabaseConfigured) return [];

  const nowIso = new Date().toISOString();
  let query = client
    .from("ads")
    .select("*")
    .eq("status", "published")
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

  if (options.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query.order("is_featured", { ascending: false }).order("ends_at", {
    ascending: true,
    nullsFirst: false,
  });
  if (error || !data) return [];

  const ads = (data as Record<string, unknown>[]).map((row) => mapAdRow(row));
  return attachMedia(client, ads);
}

/** Loads a single published ad by slug (returns null for unpublished/absent). */
export async function loadAdBySlug(
  slug: string,
  options: { client?: SupabaseClient } = {}
): Promise<Ad | null> {
  const client = options.client ?? supabase;
  if (!client || !isSupabaseConfigured) return null;

  const { data, error } = await client
    .from("ads")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;

  const ad = mapAdRow(data as Record<string, unknown>);
  const [withMedia] = await attachMedia(client, [ad]);
  return withMedia ?? ad;
}
