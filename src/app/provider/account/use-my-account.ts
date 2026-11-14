"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  fetchProviderServiceAreas,
  saveProviderServiceAreas,
  type ProviderServiceArea,
} from "@/lib/locations";
import { resolveLocationCoordinates } from "@/lib/data/uganda-locations";
import { abandonMediaAsset, refreshPendingMedia } from "@/lib/media-lifecycle";
import { listingTarget } from "@/lib/media-policy";
import {
  PROFILE_MEDIA_COLUMNS,
  mergePortfolioMedia,
  toPortfolioMedia,
  type PortfolioMedia,
  type ProfileMediaRow,
} from "@/lib/media-records";
import { type RegisteredMedia } from "@/lib/media-upload";
import { usePortfolioQueue } from "../onboarding/use-portfolio-queue";
import { DAYS } from "../onboarding/onboarding-config";

export interface AccountProfile {
  account_kind: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  model_tier: string | null;
}

export interface AccountListing {
  id: string;
  title: string;
  slug: string;
  kind: string;
  escort_tier: string | null;
  service_type: string | null;
  verification_status: string;
  verification_notes: string | null;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
  location_code: string | null;
  travel_km: string | null;
  summary_line: string | null;
  description: string | null;
  services_offered: string[] | null;
  languages: string[] | null;
  availability: Array<{ label: string; on?: boolean; from?: string; to?: string }> | null;
  images: string[] | null;
  cover_image: string | null;
  profile_details: Record<string, unknown> | null;
}

interface SaveResult {
  ok: boolean;
  message?: string;
}

const fail = (message?: string | null): SaveResult => ({ ok: false, message: message ?? "Something went wrong." });
const OK: SaveResult = { ok: true };

function daysOf(availability: AccountListing["availability"]): string[] {
  return (availability ?? []).filter((day) => day.on).map((day) => day.label);
}

function timeOf(availability: AccountListing["availability"], key: "from" | "to", fallback: string): string {
  const day = (availability ?? []).find((entry) => entry.on && entry[key]);
  return day ? String(day[key] ?? fallback) : fallback;
}

/**
 * State and side effects for the My Account page. Every section saves through
 * here so the re-moderation rule lives in one place: an owner write over a
 * `verified` listing always lands `verification_status = 'pending'` (the RLS
 * policy rejects keeping `verified` on owner updates), and the page surfaces a
 * notice the first time that happens.
 */
export function useMyAccount(requestedListingId: string) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [listings, setListings] = useState<AccountListing[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modelServiceOptions, setModelServiceOptions] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PortfolioMedia[]>([]);
  const [areas, setAreas] = useState<ProviderServiceArea[]>([]);
  // Set once a save has re-opened review on a previously verified listing.
  const [remoderationNotice, setRemoderationNotice] = useState(false);

  const listingRef = useRef<AccountListing | null>(null);
  const existingMediaRef = useRef<PortfolioMedia[]>([]);
  const areasRef = useRef<ProviderServiceArea[]>([]);
  const listingIdRef = useRef<string | null>(null);
  existingMediaRef.current = existingMedia;
  areasRef.current = areas;

  const listing = listings.find((item) => item.id === listingId) ?? null;
  listingRef.current = listing;
  listingIdRef.current = listingId;
  const isEscort = listing?.kind === "escort";

  const getAccessToken = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error(sessionError?.message ?? "Your session expired. Sign in again.");
    }
    return data.session.access_token;
  }, []);

  // Load the profile, every owned listing and the selected listing's media.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!supabase) {
        setLoadError("My Account is unavailable because the database is not configured.");
        setLoading(false);
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !authData.user) {
        setLoadError(authError?.message ?? "Sign in to manage your account.");
        setLoading(false);
        return;
      }
      const [profileResult, listingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("account_kind,name,phone,country,model_tier")
          .eq("id", authData.user.id)
          .maybeSingle(),
        supabase
          .from("listings")
          .select("*")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (profileResult.error || listingsResult.error) {
        setLoadError(profileResult.error?.message ?? listingsResult.error?.message ?? "");
        setLoading(false);
        return;
      }
      setProfile((profileResult.data ?? null) as AccountProfile | null);
      const rows = (listingsResult.data ?? []) as unknown as AccountListing[];
      setListings(rows);
      const initial =
        rows.find((row) => row.id === requestedListingId) ?? rows[0] ?? null;
      setListingId(initial?.id ?? null);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
    // `requestedListingId` only seeds the initial selection; later changes are
    // handled by selectListing so editing is never reset by the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-listing side loads: media rows, coverage areas and hot-offer options.
  useEffect(() => {
    if (!listingId || !supabase) return;
    let cancelled = false;
    setRemoderationNotice(false);
    void (async () => {
      const [{ data: media }, loadedAreas] = await Promise.all([
        supabase
          .from("profile_media")
          .select(PROFILE_MEDIA_COLUMNS)
          .eq("listing_id", listingId)
          .order("sort_order", { ascending: true }),
        fetchProviderServiceAreas(listingId),
      ]);
      if (cancelled) return;
      setExistingMedia(((media ?? []) as ProfileMediaRow[]).map(toPortfolioMedia));
      setAreas(loadedAreas);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    if (!supabase || !isEscort || modelServiceOptions.length > 0) return;
    void supabase
      .from("escort_service_options")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        else setModelServiceOptions((data ?? []).map((option) => option.name));
      });
  }, [isEscort, modelServiceOptions.length]);

  const selectListing = useCallback((id: string) => {
    setListingId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("listing", id);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /** The queue uploads straight onto the selected listing - it always exists. */
  const ensureListing = useCallback(async () => listingIdRef.current, []);

  const handleRegistered = useCallback((media: RegisteredMedia) => {
    setExistingMedia((current) => mergePortfolioMedia(current, toPortfolioMedia(media)));
  }, []);

  const queue = usePortfolioQueue({
    getAccessToken,
    ensureListing,
    onRegistered: handleRegistered,
    getCounts: () => ({
      photo: existingMediaRef.current.filter((item) => item.kind === "photo").length,
      video: existingMediaRef.current.filter((item) => item.kind === "video").length,
    }),
    getListingId: () => listingIdRef.current,
  });

  /**
   * Section save helper: applies a partial update to the selected listing and
   * enforces the re-moderation rule. `payload` may override the status when a
   * draft must stay a draft, but a verified row can only go back to 'pending'.
   */
  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<SaveResult> => {
      const current = listingRef.current;
      if (!supabase || !current) return fail("No profile is selected.");
      const wasVerified = current.verification_status === "verified";
      const body = wasVerified
        ? { ...payload, verification_status: "pending" }
        : payload;
      const { data, error } = await supabase
        .from("listings")
        .update(body)
        .eq("id", current.id)
        .select("*")
        .maybeSingle();
      if (error) return fail(error.message);
      if (data) {
        const updated = data as unknown as AccountListing;
        setListings((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
        listingRef.current = updated;
      }
      if (wasVerified) setRemoderationNotice(true);
      return OK;
    },
    []
  );

  /** Section 2: profiles.name/phone go through the definer RPC (no owner UPDATE policy). */
  const saveIdentity = useCallback(
    async (input: {
      name: string;
      phone: string;
      title: string;
      age: string;
      gender: string;
      nationality: string;
      orientation: string;
      summaryLine: string;
    }): Promise<SaveResult> => {
      if (!supabase) return fail("Supabase is not configured.");
      const current = listingRef.current;
      if (!current) return fail("No profile is selected.");
      const { error: profileError } = await supabase.rpc("update_own_profile", {
        p_name: input.name.trim(),
        p_phone: input.phone.trim() || null,
        p_model_tier: null,
      });
      if (profileError) return fail(profileError.message);
      setProfile((value) =>
        value ? { ...value, name: input.name.trim(), phone: input.phone.trim() || null } : value
      );
      const details = { ...(current.profile_details ?? {}), orientation: input.orientation };
      return mutate({
        title: input.title.trim() || current.title,
        age: current.kind === "escort" ? Number(input.age) || current.age : null,
        gender: input.gender || null,
        nationality: input.nationality || null,
        summary_line: input.summaryLine.trim() || current.summary_line,
        profile_details: details,
      });
    },
    [mutate]
  );

  /** Section 3: mirrors the availability shape written by the onboarding wizard. */
  const saveServices = useCallback(
    async (input: { services: string[]; languages: string[]; availableDays: string[]; from: string; to: string }) => {
      const availability = DAYS.map((label) => ({
        label,
        on: input.availableDays.includes(label),
        from: input.from,
        to: input.to,
      }));
      return mutate({
        services_offered: input.services,
        languages: input.languages,
        availability,
      });
    },
    [mutate]
  );

  /** Section 4: registration location + travel radius + coverage areas. */
  const saveLocation = useCallback(
    async (input: {
      country: string;
      city: string;
      neighborhood: string;
      locationCode: string;
      travelKm: string;
      areas: ProviderServiceArea[];
    }) => {
      const coords = resolveLocationCoordinates(input.country, input.city, input.neighborhood);
      const result = await mutate({
        country: input.country,
        city: input.city,
        neighborhood: input.neighborhood,
        location_code: input.locationCode || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        travel_km: input.travelKm,
      });
      if (!result.ok) return result;
      const areasError = await saveProviderServiceAreas(listingRef.current!.id, input.areas);
      if (areasError) return { ok: true, message: `Profile saved, but coverage failed: ${areasError}` };
      setAreas(input.areas);
      return OK;
    },
    [mutate]
  );

  const photoUrls = useCallback(
    (media: PortfolioMedia[]) =>
      media.filter((item) => item.kind === "photo").map((item) => item.url),
    []
  );

  /** Keeps the legacy listing.images/cover_image arrays in step with the rows. */
  const syncListingMediaArrays = useCallback(
    async (media: PortfolioMedia[]) => {
      const urls = photoUrls(media);
      const firstCard = media.find((item) => item.kind === "photo");
      await mutate({ images: urls, cover_image: firstCard?.cardUrl ?? urls[0] ?? null });
    },
    [mutate, photoUrls]
  );

  /** Section 5 delete: removes the asset + row, then re-syncs the gallery arrays. */
  const removeMedia = useCallback(
    async (media: PortfolioMedia): Promise<SaveResult> => {
      if (!supabase || !listingIdRef.current) return fail("No profile is selected.");
      try {
        const token = await getAccessToken();
        await abandonMediaAsset(
          {
            publicId: media.cloudinaryPublicId,
            mediaKey: media.mediaKey,
            streamUid: media.streamUid,
          },
          listingTarget(listingIdRef.current),
          token
        );
      } catch (error) {
        // A missing asset is exactly what removal wants; anything else is fatal.
        const message = error instanceof Error ? error.message : "Media could not be removed.";
        if (!/not found|404/i.test(message)) return fail(message);
      }
      const next = existingMediaRef.current.filter((item) =>
        media.id ? item.id !== media.id : item.url !== media.url
      );
      setExistingMedia(next);
      await syncListingMediaArrays(next);
      return OK;
    },
    [getAccessToken, syncListingMediaArrays]
  );

  /** Section 5 poll: asks the status route to re-check processing media. */
  const refreshMedia = useCallback(async (): Promise<SaveResult> => {
    const id = listingIdRef.current;
    if (!supabase || !id) return fail("No profile is selected.");
    try {
      const token = await getAccessToken();
      const refreshed = await refreshPendingMedia(listingTarget(id), token);
      setExistingMedia((current) =>
        refreshed.reduce((acc, media) => mergePortfolioMedia(acc, toPortfolioMedia(media)), current)
      );
      return OK;
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Media status could not be checked.");
    }
  }, [getAccessToken]);

  // Uploads that finish while the page is open must also refresh images[].
  const lastMediaSignatureRef = useRef("");
  const mediaSignature = existingMedia.map((item) => `${item.id}:${item.processingStatus}`).join("|");
  useEffect(() => {
    if (!listingRef.current || existingMedia.length === 0) return;
    if (mediaSignature === lastMediaSignatureRef.current) return;
    // Only sync when a brand-new row appeared (uploads), not on every re-check.
    const hasUnsynced = photoUrls(existingMedia).some((url) => !(listingRef.current?.images ?? []).includes(url));
    lastMediaSignatureRef.current = mediaSignature;
    if (hasUnsynced) void syncListingMediaArrays(existingMedia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaSignature]);

  return {
    profile,
    listings,
    listing,
    loading,
    loadError,
    isEscort,
    modelServiceOptions,
    existingMedia,
    areas,
    remoderationNotice,
    queue,
    selectListing,
    saveIdentity,
    saveServices,
    saveLocation,
    removeMedia,
    refreshMedia,
    daysOf,
    timeOf,
  };
}

export type MyAccountController = ReturnType<typeof useMyAccount>;
