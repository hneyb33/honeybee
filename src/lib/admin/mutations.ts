import { supabase } from "@/lib/supabase/client";

export interface MutationResult {
  ok: boolean;
  error: string | null;
}

function failure(error: unknown, fallback = "Action failed."): MutationResult {
  if (error instanceof Error) return { ok: false, error: error.message };
  if (typeof error === "string") return { ok: false, error };
  return { ok: false, error: fallback };
}

function unwrap(result: { error: { message: string } | null } | null): MutationResult {
  if (!result) return { ok: true, error: null };
  if (result.error) return { ok: false, error: result.error.message };
  return { ok: true, error: null };
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<MutationResult> {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const { error } = await supabase.rpc(fn, args);
  return unwrap({ error });
}

// ---------------------------------------------------------------------------
// Ads
// ---------------------------------------------------------------------------

export const adsMutations = {
  publish: (adId: string) => rpc("admin_publish_ad", { p_ad_id: adId }),
  reject: (adId: string, notes: string | null) =>
    rpc("admin_reject_ad", { p_ad_id: adId, p_notes: notes }),
  setPlacement: (input: {
    adId: string;
    featured: boolean;
    tier?: "premium" | "vip" | null;
    startsAt?: string | null;
    endsAt?: string | null;
  }) =>
    rpc("admin_set_ad_placement", {
      p_ad_id: input.adId,
      p_featured: input.featured,
      p_tier: input.tier ?? null,
      p_starts_at: input.startsAt ?? null,
      p_ends_at: input.endsAt ?? null,
    }),
  settlePayment: (adId: string, status: string, paymentId: string | null) =>
    rpc("admin_settle_ad_payment", {
      p_ad_id: adId,
      p_payment_status: status,
      p_payment_id: paymentId,
    }),
  update: (adId: string, data: Record<string, unknown>) =>
    rpc("admin_update_ad", { p_ad_id: adId, p_data: data }),
  remove: (adId: string) => rpc("admin_delete_ad", { p_ad_id: adId }),
};

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const listingsMutations = {
  moderate: (listingId: string, status: string, notes?: string | null) =>
    rpc("admin_moderate_listing", {
      p_listing_id: listingId,
      p_status: status,
      p_notes: notes ?? null,
    }),
  feature: (listingId: string, featured: boolean, tier?: "premium" | "vip" | null, until?: string | null) =>
    rpc("admin_set_listing_ad", {
      p_listing_id: listingId,
      p_featured: featured,
      p_tier: tier ?? null,
      p_featured_until: until ?? null,
    }),
  update: (
    listingId: string,
    patch: Partial<{
      title: string;
      category: string;
      city: string;
      neighborhood: string;
      hourly_rate: number;
      verification_status: string;
      verification_notes: string;
      cover_image: string;
    }>,
  ) => {
    if (!supabase) return Promise.resolve({ ok: false, error: "Supabase is not configured." });
    return supabase
      .from("listings")
      .update(patch)
      .eq("id", listingId)
      .then((res) => unwrap(res));
  },
  remove: (listingId: string) => rpc("admin_delete_listing", { p_listing_id: listingId }),
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const paymentsMutations = {
  review: (paymentId: string, action: "verify" | "reject", reason: string | null) =>
    rpc("admin_review_payment", {
      p_payment_id: paymentId,
      p_action: action,
      p_rejection_reason: reason,
    }),
  remove: (paymentId: string) => rpc("admin_delete_payment", { p_payment_id: paymentId }),
};

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const subscriptionsMutations = {
  setStatus: (subscriptionId: string, status: "active" | "expired" | "cancelled" | "pending") =>
    rpc("admin_set_subscription_status", { p_subscription_id: subscriptionId, p_status: status }),
  remove: (subscriptionId: string) =>
    rpc("admin_delete_subscription", { p_subscription_id: subscriptionId }),
};

// ---------------------------------------------------------------------------
// Users / roles
// ---------------------------------------------------------------------------

export const usersMutations = {
  updateProfile: (input: { userId: string; name: string; phone: string | null; accountKind: string }) =>
    rpc("admin_update_profile", {
      p_user_id: input.userId,
      p_name: input.name,
      p_phone: input.phone,
      p_account_kind: input.accountKind,
    }),
  setRole: (userId: string, role: string) =>
    rpc("admin_set_profile_role", { p_user_id: userId, p_role: role }),
  remove: (userId: string) => rpc("admin_delete_profile", { p_user_id: userId }),
};

// ---------------------------------------------------------------------------
// Flags / audit
// ---------------------------------------------------------------------------

export const flagsMutations = {
  raise: (input: {
    entity: "profile" | "listing" | "ad" | "payment";
    entityId: string;
    kind: "review" | "abuse" | "fraud" | "quality" | "legal";
    reason: string;
  }) =>
    rpc("admin_flag_entity", {
      p_entity: input.entity,
      p_entity_id: input.entityId,
      p_kind: input.kind,
      p_reason: input.reason,
    }),
  resolve: (flagId: string, resolution: string) =>
    rpc("admin_resolve_flag", { p_flag_id: flagId, p_resolution: resolution }),
};

// ---------------------------------------------------------------------------
// Direct dictionary mutations (services / places) — writes go through RLS
// policies added in the 20261105 admin migration.
// ---------------------------------------------------------------------------

export const serviceOptionsMutations = {
  create: async (row: { id: string; name: string; sort_order: number; is_active: boolean }) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("escort_service_options").insert(row);
    return error ? failure(error.message) : { ok: true, error: null };
  },
  update: async (id: string, patch: Partial<{ name: string; sort_order: number; is_active: boolean }>) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("escort_service_options").update(patch).eq("id", id);
    return error ? failure(error.message) : { ok: true, error: null };
  },
  remove: async (id: string) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("escort_service_options").delete().eq("id", id);
    return error ? failure(error.message) : { ok: true, error: null };
  },
};

export const placesMutations = {
  create: async (row: { name: string; area: string; city: string; latitude: number; longitude: number }) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("places").insert(row);
    return error ? failure(error.message) : { ok: true, error: null };
  },
  update: async (id: string, patch: Partial<{ name: string; area: string; city: string; latitude: number; longitude: number }>) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("places").update(patch).eq("id", id);
    return error ? failure(error.message) : { ok: true, error: null };
  },
  remove: async (id: string) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." } as MutationResult;
    const { error } = await supabase.from("places").delete().eq("id", id);
    return error ? failure(error.message) : { ok: true, error: null };
  },
};

// ---------------------------------------------------------------------------
// Category dictionaries — implicit dictionaries built from the distinct
// `category` values used by listings and ads. Renaming rewrites every row
// (RLS admin write policies from the 20261105 migration allow this).
// ---------------------------------------------------------------------------

type CategoryTable = "listings" | "ads";

export const categoryMutations = {
  rename: async (table: CategoryTable, from: string, to: string): Promise<MutationResult> => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." };
    const next = to.trim();
    if (!next || next === from) return { ok: false, error: "Nothing to change." };
    const { error } = await supabase.from(table).update({ category: next }).eq("category", from);
    return error ? { ok: false, error: error.message } : { ok: true, error: null };
  },
  remove: async (table: CategoryTable, value: string): Promise<MutationResult> => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." };
    const patch = table === "ads" ? { category: null } : { category: "other" };
    const { error } = await supabase.from(table).update(patch).eq("category", value);
    return error ? { ok: false, error: error.message } : { ok: true, error: null };
  },
};

// ---------------------------------------------------------------------------
// Bulk helper — runs each mutation sequentially and returns aggregate results
// ---------------------------------------------------------------------------

export async function runBulk(
  items: string[],
  action: (id: string) => Promise<MutationResult>,
  cap = 50,
): Promise<{ succeeded: string[]; failed: { id: string; error: string }[]; skipped: string[] }> {
  const target = items.slice(0, cap);
  const skipped = items.slice(cap);
  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of target) {
    const result = await action(id);
    if (result.ok) succeeded.push(id);
    else failed.push({ id, error: result.error ?? "Unknown error" });
  }
  return { succeeded, failed, skipped };
}
