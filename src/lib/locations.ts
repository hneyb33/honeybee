import { supabase } from "@/lib/supabase/client";

/**
 * Client access to the shared East Africa gazetteer (`public.locations`).
 * The table is the single geographic service for onboarding pickers, search
 * autocomplete and discovery suggestions — models, specialists and agencies all
 * read the same hierarchy (Country > region > district > city > neighbourhood).
 *
 * Every helper degrades to an empty result when Supabase is missing or the
 * migration has not been applied yet, so static fallbacks keep working.
 */

export type LocationType =
  | "COUNTRY"
  | "STATE"
  | "ADMIN1"
  | "ADMIN2"
  | "ADMIN_AREA"
  | "DIVISION"
  | "CITY"
  | "TOWN"
  | "NEIGHBOURHOOD";

export interface GazetteerNode {
  code: string;
  name: string;
  location_type: LocationType;
  parent_code: string | null;
  country_code: string;
  admin_level: number | null;
}

export interface LocationHit extends GazetteerNode {
  display_path: string;
}

/** Names used by listings.country / profiles.country (free text today). */
const COUNTRY_NAME_BY_CODE: Record<string, string> = {
  UG: "Uganda",
  KE: "Kenya",
  RW: "Rwanda",
  BI: "Burundi",
  CD: "Democratic Republic of the Congo",
  SS: "South Sudan",
};

const COUNTRY_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_BY_CODE).map(([code, name]) => [name.toLowerCase(), code]),
);

export function countryCodeForName(name: string | null | undefined): string | null {
  if (!name) return null;
  return COUNTRY_CODE_BY_NAME[name.trim().toLowerCase()] ?? null;
}

export function countryNameForCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_NAME_BY_CODE[code.toUpperCase()] ?? null;
}

/** Human labels for each administrative level, used by the cascader. */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  COUNTRY: "Country",
  STATE: "State",
  ADMIN1: "County / Region / State",
  ADMIN2: "District / Sub-region",
  ADMIN_AREA: "Administrative area",
  DIVISION: "Division",
  CITY: "City / Town",
  TOWN: "Town",
  NEIGHBOURHOOD: "Neighbourhood / Estate",
};

export function labelForChildType(type: LocationType | undefined, fallback = "Area"): string {
  if (!type) return fallback;
  if (type === "CITY") return "City / Town";
  if (type === "TOWN") return "Town";
  return LOCATION_TYPE_LABELS[type] ?? fallback;
}

/** True when children of this node are still "above" city level. */
export function isAdminTier(type: LocationType): boolean {
  return type === "STATE" || type === "ADMIN1" || type === "ADMIN2" || type === "ADMIN_AREA" || type === "DIVISION";
}

// ---------------------------------------------------------------------------
// Cached fetchers — module-level promises dedupe concurrent + repeat reads.
// ---------------------------------------------------------------------------

let countriesPromise: Promise<GazetteerNode[]> | null = null;
const childrenPromises = new Map<string, Promise<GazetteerNode[]>>();

export async function fetchGazetteerCountries(): Promise<GazetteerNode[]> {
  if (!supabase) return [];
  if (!countriesPromise) {
    countriesPromise = (async () => {
      const { data, error } = await supabase!
        .from("locations")
        .select("code,name,location_type,parent_code,country_code,admin_level")
        .eq("location_type", "COUNTRY")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) {
        countriesPromise = null;
        return [];
      }
      return (data ?? []) as GazetteerNode[];
    })();
  }
  return countriesPromise;
}

export async function fetchLocationChildren(parentCode: string): Promise<GazetteerNode[]> {
  if (!supabase || !parentCode) return [];
  const cached = childrenPromises.get(parentCode);
  if (cached) return cached;
  const promise = (async () => {
    const { data, error } = await supabase!
      .from("locations")
      .select("code,name,location_type,parent_code,country_code,admin_level")
      .eq("parent_code", parentCode)
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      childrenPromises.delete(parentCode);
      return [];
    }
    return (data ?? []) as GazetteerNode[];
  })();
  childrenPromises.set(parentCode, promise);
  return promise;
}

/** Major cities/towns of a country — powers the discovery suggestion strips. */
export async function fetchCountryCities(countryCode: string, limit = 12): Promise<GazetteerNode[]> {
  if (!supabase || !countryCode) return [];
  const { data, error } = await supabase
    .from("locations")
    .select("code,name,location_type,parent_code,country_code,admin_level")
    .eq("country_code", countryCode)
    .in("location_type", ["CITY", "TOWN"])
    .eq("is_active", true)
    .order("is_verified", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as GazetteerNode[];
}

/**
 * Cross-level autocomplete via the `search_locations` SQL function: matches
 * names and aliases at every level and returns the "UG / Central / Kampala"
 * display path alongside each hit.
 */
export async function searchLocations(
  query: string,
  options: { countryCode?: string | null; limit?: number } = {},
): Promise<LocationHit[]> {
  if (!supabase) return [];
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { data, error } = await supabase.rpc("search_locations", {
    p_query: trimmed,
    p_country_code: options.countryCode ?? null,
    p_limit: options.limit ?? 12,
  });
  if (error || !data) return [];
  return data as LocationHit[];
}

/** All ancestor codes of a node (self last), for pre-filling a cascade trail. */
export async function fetchLocationAncestorCodes(code: string): Promise<GazetteerNode[]> {
  if (!supabase || !code) return [];
  // Walk up level by level; the hierarchy is shallow (max 5 tiers).
  const chain: GazetteerNode[] = [];
  let current: string | null = code;
  for (let guard = 0; guard < 6 && current; guard += 1) {
    const result = await supabase
      .from("locations")
      .select("code,name,location_type,parent_code,country_code,admin_level")
      .eq("code", current)
      .maybeSingle();
    const node = (result.data ?? null) as GazetteerNode | null;
    if (result.error || !node) break;
    chain.unshift(node);
    current = node.parent_code ?? null;
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Provider service coverage (provider_service_areas)
// ---------------------------------------------------------------------------

export type ServiceCoverageTier = "primary" | "secondary" | "remote";

export interface ProviderServiceArea {
  code: string;
  name: string;
  display_path?: string;
  coverage: ServiceCoverageTier;
}

export async function fetchProviderServiceAreas(listingId: string): Promise<ProviderServiceArea[]> {
  if (!supabase || !listingId) return [];
  const { data, error } = await supabase
    .from("provider_service_areas")
    .select("location_code,coverage,locations(name)")
    .eq("listing_id", listingId);
  if (error || !data) return [];
  return data.map((row) => {
    const embedded = row.locations as { name?: string } | { name?: string }[] | null;
    const embeddedName = Array.isArray(embedded) ? embedded[0]?.name : embedded?.name;
    return {
      code: String(row.location_code),
      name: String(embeddedName ?? row.location_code),
      coverage: (["primary", "secondary", "remote"].includes(String(row.coverage))
        ? String(row.coverage)
        : "secondary") as ServiceCoverageTier,
    };
  });
}

/** Atomically replaces the coverage set; owner (or admin) only, enforced in SQL. */
export async function saveProviderServiceAreas(
  listingId: string,
  areas: ProviderServiceArea[],
): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const payload = areas.slice(0, 12).map((area) => ({ code: area.code, coverage: area.coverage }));
  const { error } = await supabase.rpc("set_provider_service_areas", {
    p_listing_id: listingId,
    p_areas: payload,
  });
  return error ? error.message : null;
}
