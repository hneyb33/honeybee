/**
 * Typed Supabase query helpers for the admin dashboard.
 *
 * Each fetcher returns `{ rows, count, error }` so pages can render loading
 * and error states uniformly without unwrapping PostgREST envelopes. The
 * client is the same anon-auth Supabase instance used elsewhere in the app;
 * the SQL RLS policies (see migrations prefixed `admin_`) restrict visibility
 * to callers whose `profiles.role` is super_admin or moderator.
 */

import { supabase } from "@/lib/supabase/client";
import type { AdminRole } from "@/lib/admin/permissions";

export interface QueryResult<T> {
  rows: T[];
  count: number;
  error: string | null;
}

const EMPTY: QueryResult<never> = { rows: [], count: 0, error: null };

function missing(): QueryResult<never> {
  return { rows: [], count: 0, error: "Configure Supabase to use the admin dashboard." };
}

// ---------------------------------------------------------------------------
// Shared record shapes (subset of full DB row; only columns the admin UI needs)
// ---------------------------------------------------------------------------

export interface AdminAdRow {
  id: string;
  user_id: string | null;
  ad_type: string;
  title: string;
  slug: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  description: string;
  summary_line: string | null;
  status: string;
  moderation_notes: string | null;
  is_featured: boolean;
  featured_tier: "premium" | "vip" | null;
  starts_at: string;
  ends_at: string | null;
  amount: number;
  currency: string;
  payment_status: string;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; email: string | null } | null;
}

export interface AdminListingRow {
  id: string;
  user_id: string | null;
  title: string;
  slug: string;
  kind: string;
  category: string | null;
  escort_tier: string | null;
  city: string | null;
  neighborhood: string | null;
  hourly_rate: number | null;
  verification_status: string;
  verification_notes: string | null;
  is_featured: boolean;
  featured_tier: "premium" | "vip" | null;
  featured_until: string | null;
  cover_image: string | null;
  created_at: string;
  profiles?: { name: string; email: string | null } | null;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  country: string | null;
  account_kind: string;
  advertiser_type: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  listings_count?: number;
}

export interface AdminPaymentRow {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  provider: string;
  amount: number;
  currency: string;
  merchant_code: string | null;
  payer_phone: string | null;
  transaction_id: string | null;
  proof_url: string | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
  listing_id: string | null;
  ad_id: string | null;
  subscription_id: string | null;
  profiles?: { name: string; email: string | null } | null;
  listings?: { title: string } | null;
  ads?: { title: string } | null;
}

export interface AdminSubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  profiles?: { name: string; email: string | null } | null;
}

export interface AdminAuditRow {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  actor?: { name: string } | null;
}

export interface AdminFlagRow {
  id: string;
  entity: string;
  entity_id: string;
  kind: string;
  reason: string;
  raised_at: string;
  resolved_at: string | null;
  raised_by?: { name: string } | null;
  resolved_by?: { name: string } | null;
  resolution: string | null;
}

export interface AdminServiceOptionRow {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminPlaceRow {
  id: string;
  name: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AdminCategoryBucket {
  /** Synthetic id (the category value itself) so the bucket fits AdminDataTable. */
  id: string;
  category: string;
  count: number;
}

/**
 * Category dictionaries are implicit (there is no `categories` table): the
 * admin UI treats the distinct values already used by listings and ads as the
 * editable dictionary. Renaming rewrites every row, so counts come from the
 * same scan.
 */
export async function fetchListingCategories(): Promise<QueryResult<AdminCategoryBucket>> {
  if (!supabase) return missing();
  const { data, error } = await supabase.from("listings").select("category").limit(2000);
  if (error) return { rows: [], count: 0, error: error.message };
  return { rows: bucketizeCategories(data), count: 0, error: null };
}

export async function fetchAdCategories(): Promise<QueryResult<AdminCategoryBucket>> {
  if (!supabase) return missing();
  const { data, error } = await supabase.from("ads").select("category").limit(2000);
  if (error) return { rows: [], count: 0, error: error.message };
  return { rows: bucketizeCategories(data), count: 0, error: null };
}

function bucketizeCategories(
  rows: Array<{ category: string | null }> | null,
): AdminCategoryBucket[] {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    const key = (row.category ?? "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ id: category, category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

export interface AdminListingMediaRow {
  id: string;
  url: string;
  kind: "photo" | "video";
  sort_order: number;
  thumbnail_url: string | null;
  card_url: string | null;
  detail_url: string | null;
  playback_url: string | null;
  storage_provider: string | null;
  processing_status: string | null;
  listing_id: string;
}

// ---------------------------------------------------------------------------
// Filters + pagination
// ---------------------------------------------------------------------------

export interface ListFilters {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  kind?: string;
  paymentStatus?: string;
  accountKind?: string;
  userRole?: AdminRole | "any";
  featuredOnly?: boolean;
  pendingOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchAds(filters: ListFilters = {}): Promise<QueryResult<AdminAdRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("ads")
    .select(
      "id,user_id,ad_type,title,slug,category,city,neighborhood,country,description,summary_line,status,moderation_notes,is_featured,featured_tier,starts_at,ends_at,amount,currency,payment_status,cover_image,created_at,updated_at,profiles!ads_user_id_fkey(name,email)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
  if (filters.featuredOnly) query = query.eq("is_featured", true);

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  // PostgREST types the embedded to-one `profiles` hint as an array; flatten
  // happens here once so every consumer sees the declared row shape.
  return { rows: (data ?? []) as unknown as AdminAdRow[], count: count ?? 0, error: null };
}

export async function fetchListings(filters: ListFilters = {}): Promise<QueryResult<AdminListingRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("listings")
    .select(
      "id,user_id,title,slug,kind,category,escort_tier,city,neighborhood,hourly_rate,verification_status,verification_notes,is_featured,featured_tier,featured_until,cover_image,created_at,profiles!listings_user_id_fkey(name,email)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.status) query = query.eq("verification_status", filters.status);
  if (filters.pendingOnly) query = query.in("verification_status", ["pending", "under_review"]);

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return { rows: (data ?? []) as unknown as AdminListingRow[], count: count ?? 0, error: null };
}

export async function fetchUsers(filters: ListFilters = {}): Promise<QueryResult<AdminUserRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("profiles")
    .select("id,email,name,phone,country,account_kind,advertiser_type,role,avatar_url,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }
  if (filters.accountKind) query = query.eq("account_kind", filters.accountKind);
  if (filters.userRole === "super_admin" || filters.userRole === "moderator") {
    query = query.eq("role", filters.userRole);
  } else if (filters.userRole === "any") {
    query = query.in("role", ["super_admin", "moderator"]);
  } else if (filters.status) {
    query = query.eq("role", filters.status);
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return { rows: (data ?? []) as AdminUserRow[], count: count ?? 0, error: null };
}

export async function fetchPayments(filters: ListFilters = {}): Promise<QueryResult<AdminPaymentRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("payments")
    .select(
      "id,user_id,plan,period,provider,amount,currency,merchant_code,payer_phone,transaction_id,proof_url,status,rejection_reason,submitted_at,verified_at,created_at,listing_id,ad_id,subscription_id,profiles!payments_user_id_fkey(name,email),listings(title),ads(title)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.pendingOnly) query = query.eq("status", "submitted");
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`transaction_id.ilike.${like},payer_phone.ilike.${like},merchant_code.ilike.${like}`);
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return {
    rows: (data ?? []) as unknown as AdminPaymentRow[],
    count: count ?? 0,
    error: null,
  };
}

export async function fetchSubscriptions(
  filters: ListFilters = {},
): Promise<QueryResult<AdminSubscriptionRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("subscriptions")
    .select("id,user_id,plan,period,status,starts_at,ends_at,created_at,profiles!subscriptions_user_id_fkey(name,email)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`plan.ilike.${like},profiles(name.ilike.${like})`);
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return {
    rows: (data ?? []) as unknown as AdminSubscriptionRow[],
    count: count ?? 0,
    error: null,
  };
}

export async function fetchAuditLog(
  filters: ListFilters & { entity?: string; actorId?: string } = {},
): Promise<QueryResult<AdminAuditRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("admin_audit_log")
    .select("id,actor_id,actor_role,action,entity,entity_id,before,after,reason,created_at,actor:profiles!admin_audit_log_actor_id_fkey(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.entity) query = query.eq("entity", filters.entity);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`action.ilike.${like},reason.ilike.${like}`);
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return {
    rows: (data ?? []) as unknown as AdminAuditRow[],
    count: count ?? 0,
    error: null,
  };
}

export async function fetchFlags(
  filters: ListFilters & { includeResolved?: boolean; entity?: string } = {},
): Promise<QueryResult<AdminFlagRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("admin_flags")
    .select(
      "id,entity,entity_id,kind,reason,raised_at,resolved_at,resolution,raised_by:profiles!admin_flags_raised_by_fkey(name),resolved_by:profiles!admin_flags_resolved_by_fkey(name)",
      { count: "exact" },
    )
    .order("raised_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (!filters.includeResolved) query = query.is("resolved_at", null);
  if (filters.entity && filters.entity !== "any") query = query.eq("entity", filters.entity);

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return {
    rows: (data ?? []) as unknown as AdminFlagRow[],
    count: count ?? 0,
    error: null,
  };
}

export async function fetchServiceOptions(): Promise<QueryResult<AdminServiceOptionRow>> {
  if (!supabase) return missing();
  const { data, error } = await supabase
    .from("escort_service_options")
    .select("id,name,sort_order,is_active")
    .order("sort_order", { ascending: true });
  if (error) return { rows: [], count: 0, error: error.message };
  const rows = (data ?? []) as AdminServiceOptionRow[];
  return { rows, count: rows.length, error: null };
}

export async function fetchPlaces(filters: ListFilters = {}): Promise<QueryResult<AdminPlaceRow>> {
  if (!supabase) return missing();
  const page = Math.max(0, (filters.page ?? 1) - 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));

  let query = supabase
    .from("places")
    .select("id,name,area,city,latitude,longitude", { count: "exact" })
    .order("city", { ascending: true })
    .order("area", { ascending: true })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`name.ilike.${like},area.ilike.${like},city.ilike.${like}`);
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], count: 0, error: error.message };
  return { rows: (data ?? []) as AdminPlaceRow[], count: count ?? 0, error: null };
}

export async function fetchPendingListingsWithMedia(): Promise<{
  rows: Array<AdminListingRow & { media: AdminListingMediaRow[] }>;
  error: string | null;
}> {
  if (!supabase) return { rows: [], error: "Supabase not configured." };

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select(
      "id,user_id,title,slug,kind,category,escort_tier,city,neighborhood,hourly_rate,verification_status,verification_notes,is_featured,featured_tier,featured_until,cover_image,created_at,profiles!listings_user_id_fkey(name,email)",
    )
    .in("verification_status", ["pending", "under_review"])
    .order("created_at", { ascending: true })
    .limit(50);

  if (listingsError) return { rows: [], error: listingsError.message };

  const rows = (listings ?? []) as unknown as AdminListingRow[];
  if (rows.length === 0) return { rows: [], error: null };

  const ids = rows.map((row) => row.id);
  const { data: media, error: mediaError } = await supabase
    .from("profile_media")
    .select(
      "id,url,kind,sort_order,thumbnail_url,card_url,detail_url,playback_url,storage_provider,processing_status,listing_id",
    )
    .in("listing_id", ids)
    .order("sort_order", { ascending: true });

  if (mediaError) return { rows: [], error: mediaError.message };

  const byListing = new Map<string, AdminListingMediaRow[]>();
  for (const item of (media ?? []) as AdminListingMediaRow[]) {
    const bucket = byListing.get(item.listing_id) ?? [];
    bucket.push(item);
    byListing.set(item.listing_id, bucket);
  }

  return {
    rows: rows.map((row) => ({ ...row, media: byListing.get(row.id) ?? [] })),
    error: null,
  };
}

export async function fetchAdById(id: string): Promise<AdminAdRow | null> {
  if (!supabase) return null;
  const { data: row } = await supabase
    .from("ads")
    .select(
      "id,user_id,ad_type,title,slug,category,city,neighborhood,country,description,summary_line,status,moderation_notes,is_featured,featured_tier,starts_at,ends_at,amount,currency,payment_status,cover_image,created_at,updated_at,profiles!ads_user_id_fkey(name,email)",
    )
    .eq("id", id)
    .maybeSingle();
  return (row as unknown as AdminAdRow) ?? null;
}

/** Distinct cities currently used by listings (drives the locations page). */
export async function fetchListingCities(): Promise<{ cities: string[]; error: string | null }> {
  if (!supabase) return { cities: [], error: "Supabase not configured." };
  const { data, error } = await supabase.from("listings").select("city").limit(2000);
  if (error) return { cities: [], error: error.message };
  const set = new Set<string>();
  for (const row of data ?? []) {
    const city = (row.city ?? "").trim();
    if (city) set.add(city);
  }
  return { cities: Array.from(set).sort(), error: null };
}

/** Small helper reused across admin KPI tiles. */
export async function countWhere(
  table: string,
  filter: Record<string, string | string[]>,
): Promise<number> {
  if (!supabase) return 0;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value)) query = query.in(key, value);
    else query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}
