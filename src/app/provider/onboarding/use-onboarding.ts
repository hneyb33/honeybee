"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EAST_AFRICAN_COUNTRIES, EAST_AFRICA_LOCATIONS } from "@/lib/data/uganda-locations";
import { supabase } from "@/lib/supabase/client";
import { getMediaImageUrl, getMediaVideoUrl } from "@/lib/media-urls";
import { abandonMedia, refreshPendingMedia } from "@/lib/media-lifecycle";
import { type RegisteredCloudinaryMedia } from "@/lib/cloudinary-upload";
import {
  isMediaReady,
  mergePortfolioMedia,
  toPortfolioMedia,
  type PortfolioMedia,
} from "@/lib/media-records";
import { type MediaKind } from "@/lib/media-policy";
import {
  emptyForm,
  DAYS,
  SERVICE_OPTIONS,
  MODEL_STEPS,
  SPECIALIST_STEPS,
  REQUIRES_VIDEO_FOR_MODELS,
  REQUIRES_VIDEO_FOR_SPECIALISTS,
  safeSlug,
  type AccountKind,
  type AdvertiserType,
  type OnboardingForm,
} from "./onboarding-config";
import { usePortfolioQueue } from "./use-portfolio-queue";

/**
 * All the state and side effects of the provider wizard, lifted out of the
 * component so `page.tsx` only has to render steps. Media uploads are delegated
 * to `usePortfolioQueue`, which talks to the same signature/finalize routes the
 * old inline loop used.
 */
export function useOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [accountKind, setAccountKind] = useState<AccountKind | null>(null);
  const [advertiserType, setAdvertiserType] = useState<AdvertiserType | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [existingMedia, setExistingMedia] = useState<PortfolioMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelServiceOptions, setModelServiceOptions] = useState<string[]>([]);
  const [modelServicesError, setModelServicesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const listingIdRef = useRef<string | null>(null);
  const slugRef = useRef("");
  const existingMediaRef = useRef<PortfolioMedia[]>([]);
  const formRef = useRef<OnboardingForm>(form);
  const accountKindRef = useRef<AccountKind | null>(null);
  const advertiserTypeRef = useRef<AdvertiserType | null>(null);

  listingIdRef.current = listingId;
  slugRef.current = slug;
  existingMediaRef.current = existingMedia;
  formRef.current = form;
  accountKindRef.current = accountKind;
  advertiserTypeRef.current = advertiserType;

  const isModel = accountKind === "model" || accountKind === "agency";

  const getAccessToken = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error(sessionError?.message ?? "Your session expired. Sign in again.");
    }
    return data.session.access_token;
  }, []);

  const getCounts = useCallback((): Record<MediaKind, number> => {
    const media = existingMediaRef.current;
    const queued = queuePendingCountRef.current;
    return {
      photo: media.filter((item) => item.kind === "photo").length + queued.photo,
      video: media.filter((item) => item.kind === "video").length + queued.video,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegistered = useCallback((media: RegisteredCloudinaryMedia) => {
    setExistingMedia((current) => mergePortfolioMedia(current, toPortfolioMedia(media)));
  }, []);

  const queuePendingCountRef = useRef<Record<MediaKind, number>>({ photo: 0, video: 0 });

  // `ensureListing` creates the draft row the first time a provider picks a
  // file, so uploads can begin immediately instead of waiting for "Save".
  const ensureListing = useCallback(async (): Promise<string | null> => {
    if (listingIdRef.current) return listingIdRef.current;
    if (!supabase || !accountKindRef.current) return null;
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return null;

    const currentForm = formRef.current;
    const model = accountKindRef.current !== "specialist";
    const profileSlug = slugRef.current || safeSlug(currentForm.title);
    const { data: inserted, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: authData.user.id,
        title: currentForm.title.trim() || "Untitled Honeybee profile",
        slug: profileSlug,
        kind: model ? "escort" : "service",
        description: currentForm.description.trim() || "Profile in progress.",
        verification_status: "draft",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      setError(insertError?.message ?? "Could not create your profile draft.");
      return null;
    }
    setListingId(inserted.id);
    setSlug(profileSlug);
    return inserted.id;
  }, []);

  const queue = usePortfolioQueue({
    getAccessToken,
    ensureListing,
    onRegistered: handleRegistered,
    getCounts,
    getListingId: () => listingIdRef.current,
  });

  // Feed the queue's live counts into the pre-flight validator.
  useEffect(() => {
    queuePendingCountRef.current = queue.pendingCount;
  }, [queue.pendingCount]);

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/login?next=%2Fprovider%2Fonboarding");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_kind,name,phone,phone_country,country,advertiser_type")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (profileError) {
        if (!cancelled) {
          setError(profileError.message);
          setLoading(false);
        }
        return;
      }
      if (!profile || !["model", "specialist", "agency"].includes(profile.account_kind)) {
        router.replace("/register");
        return;
      }

      const nextKind = profile.account_kind as AccountKind;
      accountKindRef.current = nextKind;
      if (nextKind !== "specialist") {
        const { data: serviceOptions, error: serviceOptionsError } = await supabase
          .from("escort_service_options")
          .select("name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (!cancelled) {
          if (serviceOptionsError) setModelServicesError(serviceOptionsError.message);
          else setModelServiceOptions((serviceOptions ?? []).map((option) => option.name));
        }
      }

      const requestedType = new URLSearchParams(window.location.search).get("type");
      const nextAdvertiserType: AdvertiserType | null =
        requestedType === "fast" || requestedType === "independent" || requestedType === "agency"
          ? requestedType
          : profile.advertiser_type === "fast" ||
            profile.advertiser_type === "independent" ||
            profile.advertiser_type === "agency"
            ? profile.advertiser_type
            : nextKind === "agency"
              ? "agency"
              : null;

      const nextForm: OnboardingForm = {
        ...emptyForm,
        country: profile.country ?? "Uganda",
        city: EAST_AFRICAN_COUNTRIES.find((country) => country.name === profile.country)?.cities[0] ?? "Kampala",
        whatsappCode: profile.phone_country ?? "+256",
        serviceType: nextKind === "specialist" ? emptyForm.serviceType : "",
      };

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("kind", nextKind === "specialist" ? "service" : "escort")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (listingError) {
        if (!cancelled) {
          setError(listingError.message);
          setLoading(false);
        }
        return;
      }

      if (listing) {
        const details = listing.profile_details ?? {};
        Object.assign(nextForm, {
          title: listing.title ?? nextForm.title,
          age: listing.age ? String(listing.age) : "",
          ageConfirmed: Boolean(details.ageConfirmed || listing.age),
          gender: listing.gender ?? "",
          nationality: listing.nationality ?? "Ugandan",
          country: listing.country ?? "Uganda",
          city: listing.city ?? "Kampala",
          neighborhood: listing.neighborhood ?? "",
          travelKm: listing.travel_km ?? "10",
          whatsappNumber: listing.whatsapp_number ?? nextForm.whatsappNumber,
          whatsappCode: listing.whatsapp_code ?? "+256",
          telegram: listing.telegram ?? "",
          serviceType: listing.service_type ?? nextForm.serviceType,
          services: Array.isArray(listing.services_offered) ? listing.services_offered : [],
          languages: Array.isArray(listing.languages) ? listing.languages : ["English"],
          availableDays: Array.isArray(listing.availability)
            ? listing.availability.filter((day: { on?: boolean }) => day.on).map((day: { label: string }) => day.label)
            : [],
          from: Array.isArray(listing.availability)
            ? listing.availability.find((day: { on?: boolean }) => day.on)?.from ?? "09:00"
            : "09:00",
          to: Array.isArray(listing.availability)
            ? listing.availability.find((day: { on?: boolean }) => day.on)?.to ?? "18:00"
            : "18:00",
          description: listing.description ?? "",
          yearsExperience: details.yearsExperience ?? "",
          certified: details.certified ?? listing.has_certificate ?? false,
          orientation: details.orientation ?? "",
          bio: listing.summary_line ?? "",
        });

        const { data: media, error: mediaError } = await supabase
          .from("profile_media")
          .select("id,url,kind,sort_order,thumbnail_url,processing_status,storage_provider,cloudinary_public_id,cloudinary_asset_id,card_url,detail_url,playback_url,original_url")
          .eq("listing_id", listing.id)
          .order("sort_order", { ascending: true });
        if (mediaError) {
          if (!cancelled) {
            setError(mediaError.message);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setListingId(listing.id);
          setSlug(listing.slug);
          const savedMedia = (media ?? []).map((item) => ({
            id: item.id,
            url: item.kind === "video" ? getMediaVideoUrl(item) : getMediaImageUrl(item, "detail"),
            kind: item.kind === "video" ? ("video" as const) : ("photo" as const),
            thumbnailUrl: item.thumbnail_url,
            processingStatus: item.processing_status as PortfolioMedia["processingStatus"],
            storageProvider: item.storage_provider as PortfolioMedia["storageProvider"],
            cloudinaryPublicId: item.cloudinary_public_id,
            cloudinaryAssetId: item.cloudinary_asset_id,
            cardUrl: item.card_url,
            detailUrl: item.detail_url,
            playbackUrl: item.playback_url,
          }));
          setExistingMedia(
            savedMedia.length > 0
              ? savedMedia
              : (Array.isArray(listing.images) ? listing.images : []).map((url: string) => ({
                  url,
                  kind: "photo" as const,
                }))
          );
          const savedStep = Number(details.onboardingStep);
          setCurrentStep(
            listing.verification_status === "draft" && Number.isInteger(savedStep)
              ? Math.min(4, Math.max(0, savedStep))
              : listing.verification_status === "draft"
                ? 0
                : 4
          );
        }
      }

      if (!cancelled) {
        setAccountKind(nextKind);
        setAdvertiserType(nextAdvertiserType);
        setForm(nextForm);
        setLoading(false);
      }
    };

    void restoreDraft();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const update = useCallback(
    <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const toggleChoice = useCallback(
    (key: "services" | "languages" | "availableDays", value: string) => {
      setForm((current) => {
        const values = current[key];
        return {
          ...current,
          [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
        };
      });
    },
    []
  );

  const readyCounts = useCallback((media: PortfolioMedia[]) => {
    const ready = media.filter(isMediaReady);
    return {
      photo: ready.filter((item) => item.kind === "photo").length,
      video: ready.filter((item) => item.kind === "video").length,
    };
  }, []);

  const validateStep = useCallback(
    (step = currentStep, media = existingMediaRef.current) => {
      const current = formRef.current;
      const model = accountKindRef.current === "model" || accountKindRef.current === "agency";
      const counts = readyCounts(media);
      const queued = queuePendingCountRef.current;
      const requireVideo = model ? REQUIRES_VIDEO_FOR_MODELS : REQUIRES_VIDEO_FOR_SPECIALISTS;

      if (step === 0 && !current.title.trim()) return "Add the name you want clients to see.";
      if (step === 0 && model && (!current.age || Number(current.age) < 18 || Number(current.age) > 100)) {
        return "You must be at least 18 years old to create a model profile.";
      }
      if (step === 0 && model && !current.ageConfirmed) return "Confirm that you are 18 or older.";
      if (step === 0 && model && !current.gender) return "Choose a gender to continue.";
      if (step === 0 && !model && !current.serviceType) return "Choose your main service category.";
      if (step === 1 && (!current.city || !current.neighborhood)) return "Choose your city and neighbourhood.";
      if (step === 1 && current.neighborhood.trim().toLowerCase() === "other") return "Enter your neighbourhood.";
      if (step === 1 && !current.whatsappNumber.trim()) return "Add a WhatsApp number clients can reach.";
      if (step === 2 && current.services.length === 0) return "Choose at least one service you offer.";
      if (step === 2 && model && modelServicesError) return "The hot-offer list could not be loaded. Refresh and try again.";
      if (step === 2 && model && modelServiceOptions.length === 0) return "No hot offers are available right now. Please try again later.";
      if (step === 2 && current.languages.length === 0) return "Choose at least one language.";
      if (step === 2 && current.availableDays.length === 0) return "Choose at least one day you are available.";
      if (step === 3 && current.description.trim().length < 40) return "Add at least 40 characters describing your profile.";
      if (step === 3 && queue.hasActiveUploads) return "Wait for your uploads to finish before continuing.";
      if (step === 3 && queue.failedCount > 0) return "Resolve or remove the failed uploads before continuing.";
      if (step === 3 && counts.photo + queued.photo === 0) return "Upload at least one portfolio photo.";
      if (step === 3 && requireVideo && counts.video + queued.video === 0) {
        return "Upload at least one portfolio video.";
      }
      return "";
    },
    [currentStep, modelServiceOptions, modelServicesError, queue.failedCount, queue.hasActiveUploads, readyCounts]
  );

  /** Writes the current form into the listing row. Assumes a session exists. */
  const writeListing = useCallback(
    async (submit: boolean): Promise<{ ok: boolean; message?: string }> => {
      if (!supabase || !accountKindRef.current) {
        return { ok: false, message: "Sign in and configure Supabase before saving your profile." };
      }
      const current = formRef.current;
      const isEscort = accountKindRef.current === "model" || accountKindRef.current === "agency";
      const media = existingMediaRef.current;
      const profileSlug = slugRef.current || safeSlug(current.title);
      const availability = DAYS.map((label) => ({
        label,
        on: current.availableDays.includes(label),
        from: current.from,
        to: current.to,
      }));
      const photoUrls = media.filter((item) => item.kind === "photo").map((item) => item.url);
      const firstCard = media.find((item) => item.kind === "photo");
      const payload = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: current.title.trim() || "Untitled Honeybee profile",
        slug: profileSlug,
        kind: isEscort ? "escort" : "service",
        escort_tier: isEscort ? "premium" : "standard",
        category: isEscort ? (current.gender || "female").toLowerCase() : "service",
        service_type: isEscort ? null : current.serviceType,
        age: isEscort ? Number(current.age) || null : null,
        gender: current.gender || null,
        nationality: current.nationality,
        country: current.country,
        city: current.city,
        neighborhood: current.neighborhood,
        hourly_rate: 0,
        monthly_price: 0,
        currency: "UGX",
        summary_line: current.bio.trim() || current.description.trim().slice(0, 140),
        description: current.description.trim() || "Profile in progress.",
        services_offered: current.services,
        languages: current.languages,
        availability,
        verification_status: submit ? "pending" : "draft",
        verification_notes: null,
        whatsapp_number: current.whatsappNumber.replace(/\D/g, ""),
        whatsapp_code: current.whatsappCode,
        telegram: current.telegram.trim() || null,
        telegram_code: "+256",
        cover_image: firstCard?.cardUrl ?? photoUrls[0] ?? null,
        images: photoUrls,
        travel_km: current.travelKm,
        advertiser_type: isEscort ? advertiserTypeRef.current ?? "independent" : null,
        has_certificate: current.certified,
        experience_band: current.yearsExperience
          ? `${current.yearsExperience} ${Number(current.yearsExperience) === 1 ? "year" : "years"} experience`
          : null,
        profile_details: {
          yearsExperience: current.yearsExperience,
          certified: current.certified,
          orientation: current.orientation,
          advertiserType: isEscort ? advertiserTypeRef.current ?? "independent" : null,
          ageConfirmed: current.ageConfirmed,
          onboardingStep: submit ? 4 : Math.min(currentStep + 1, 4),
        },
      };

      const id = listingIdRef.current;
      if (id) {
        const { error: updateError } = await supabase
          .from("listings")
          .update(payload)
          .eq("id", id)
          .eq("user_id", payload.user_id);
        if (updateError) return { ok: false, message: updateError.message };
        return { ok: true };
      }
      const { data: inserted, error: insertError } = await supabase
        .from("listings")
        .insert(payload)
        .select("id")
        .single();
      if (insertError || !inserted) {
        return { ok: false, message: insertError?.message ?? "Could not create your profile draft." };
      }
      setListingId(inserted.id);
      setSlug(profileSlug);
      return { ok: true };
    },
    [currentStep]
  );

  /** Re-checks any video still transcoding so a saved draft self-heals. */
  const refreshProcessingMedia = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    const id = listingIdRef.current;
    if (!id) return { ok: true };
    const processing = existingMediaRef.current.filter(
      (item) =>
        item.storageProvider === "cloudinary" &&
        item.processingStatus !== "ready" &&
        item.cloudinaryPublicId &&
        item.cloudinaryAssetId
    );
    if (processing.length === 0) return { ok: true };
    try {
      const token = await getAccessToken();
      const refreshed = await refreshPendingMedia(id, token);
      refreshed.forEach(handleRegistered);
    } catch (refreshError) {
      // A still-processing video is not a save error; the poller will catch it.
      if (refreshError instanceof Error && /session|configur/i.test(refreshError.message)) {
        return { ok: false, message: refreshError.message };
      }
    }
    return { ok: true };
  }, [getAccessToken, handleRegistered]);

  const persist = useCallback(
    async (submit = false): Promise<boolean> => {
      setSaving(true);
      setError("");
      const fail = (message: string) => {
        setSaving(false);
        setError(message);
        return false;
      };

      if (!supabase) return fail("Supabase is not configured.");

      const validationError = submit
        ? [0, 1, 2, 3].map((step) => validateStep(step)).find(Boolean) ?? ""
        : validateStep(currentStep);
      if (validationError) return fail(validationError);

      const refreshed = await refreshProcessingMedia();
      if (!refreshed.ok) return fail(refreshed.message ?? "Could not finish processing your media.");

      const write = await writeListing(submit);
      if (!write.ok) return fail(write.message ?? "Could not save your profile.");

      setSaving(false);
      return true;
    },
    [currentStep, refreshProcessingMedia, validateStep, writeListing]
  );

  const goToStep = useCallback((step: number) => {
    setError("");
    setCurrentStep(Math.min(4, Math.max(0, step)));
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStep < 4) {
      if (!(await persist())) return;
      setCurrentStep((step) => Math.min(4, step + 1));
      return;
    }
    if (!(await persist(true))) return;
    setSubmitted(true);
  }, [currentStep, persist]);

  const prevStep = useCallback(() => {
    setError("");
    setCurrentStep((step) => Math.max(0, step - 1));
  }, []);

  const removeExistingMedia = useCallback(
    async (media: PortfolioMedia) => {
      if (media.cloudinaryPublicId) {
        try {
          const token = await getAccessToken();
          await abandonMedia(media.cloudinaryPublicId, token);
        } catch (abandonError) {
          setError(
            abandonError instanceof Error
              ? abandonError.message
              : "That item could not be removed from Cloudinary."
          );
          return;
        }
      }
      setExistingMedia((current) =>
        current.filter(
          (item) =>
            !(
              (media.id && item.id === media.id) ||
              (media.cloudinaryPublicId && item.cloudinaryPublicId === media.cloudinaryPublicId)
            )
        )
      );
    },
    [getAccessToken]
  );

  const startOver = useCallback(() => {
    setListingId(null);
    setSlug("");
    setForm({ ...emptyForm, serviceType: "" });
    setExistingMedia([]);
    setCurrentStep(0);
    setSubmitted(false);
    setError("");
  }, []);

  const cities = useMemo(
    () => EAST_AFRICAN_COUNTRIES.find((country) => country.name === form.country)?.cities ?? [],
    [form.country]
  );
  const availableAreas = useMemo(
    () =>
      Array.from(
        new Set(
          EAST_AFRICA_LOCATIONS.filter(
            (place) => place.country === form.country && place.city === form.city
          ).map((place) => place.area)
        )
      ),
    [form.country, form.city]
  );
  const selectedServiceOptions = isModel
    ? modelServiceOptions
    : SERVICE_OPTIONS[form.serviceType] ?? [];
  const steps = isModel ? MODEL_STEPS : SPECIALIST_STEPS;

  return {
    form,
    update,
    toggleChoice,
    accountKind,
    isModel,
    advertiserType,
    currentStep,
    steps,
    goToStep,
    nextStep,
    prevStep,
    loading,
    saving,
    submitted,
    error,
    setError,
    listingId,
    existingMedia,
    removeExistingMedia,
    queue,
    validateStep,
    cities,
    availableAreas,
    selectedServiceOptions,
    modelServiceOptions,
    modelServicesError,
    startOver,
  };
}

export type OnboardingController = ReturnType<typeof useOnboarding>;
