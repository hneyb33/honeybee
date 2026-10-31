"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EAST_AFRICAN_COUNTRIES, EAST_AFRICA_LOCATIONS } from "@/lib/data/uganda-locations";
import { supabase } from "@/lib/supabase/client";
import { getMediaImageUrl, getMediaVideoUrl } from "@/lib/media-urls";
import { type RegisteredCloudinaryMedia } from "@/lib/cloudinary-upload";
import {
  mergePortfolioMedia,
  toPortfolioMedia,
  type PortfolioMedia,
} from "@/lib/media-records";
import type { MediaKind } from "@/lib/media-policy";
import type { AdType } from "@/lib/supabase/types";
import { usePortfolioQueue } from "@/app/provider/onboarding/use-portfolio-queue";
import {
  AD_STEPS,
  adTypeOption,
  emptyAdForm,
  safeAdSlug,
  type AdForm,
  type AdFormLink,
} from "./ad-config";

/**
 * All state and side effects of the Post Ad wizard, lifted out of the component.
 * Media uploads reuse the provider `usePortfolioQueue`, pointed at the `ad`
 * scope, so ads go through the exact same signed Cloudinary pipeline profiles do.
 */
export function useAd(initialType: AdType) {
  const router = useRouter();
  const option = adTypeOption(initialType);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AdForm>(() => emptyAdForm(option));
  const [adId, setAdId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [existingMedia, setExistingMedia] = useState<PortfolioMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [priceSnapshot, setPriceSnapshot] = useState<{ amount: number; currency: string }>({
    amount: 50000,
    currency: "UGX",
  });

  const adIdRef = useRef<string | null>(null);
  const slugRef = useRef("");
  const formRef = useRef<AdForm>(form);
  const existingMediaRef = useRef<PortfolioMedia[]>([]);
  const userIdRef = useRef<string | null>(null);
  const queuePendingCountRef = useRef<Record<MediaKind, number>>({ photo: 0, video: 0 });

  adIdRef.current = adId;
  slugRef.current = slug;
  formRef.current = form;
  existingMediaRef.current = existingMedia;
  userIdRef.current = userId;

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

  // Creates the draft ad row the first time a provider picks a file, so uploads
  // can begin immediately. The row is always `draft`; a provider can never write
  // `published` (blocked by RLS), and final submission moves it to `pending`.
  const ensureAd = useCallback(async (): Promise<string | null> => {
    if (adIdRef.current) return adIdRef.current;
    if (!supabase || !userIdRef.current) return null;

    const currentForm = formRef.current;
    const profileSlug = slugRef.current || safeAdSlug(currentForm.title);
    const { data: inserted, error: insertError } = await supabase
      .from("ads")
      .insert({
        user_id: userIdRef.current,
        ad_type: option.id,
        title: currentForm.title.trim() || "Untitled Honeybee ad",
        slug: profileSlug,
        category: currentForm.category,
        description: currentForm.description.trim() || "Ad in progress.",
        status: "draft",
        country: currentForm.country,
        city: currentForm.city || null,
        neighborhood: currentForm.neighborhood || null,
      })
      .select("id,slug")
      .single();
    if (insertError || !inserted) {
      return null;
    }
    setAdId(inserted.id);
    setSlug(inserted.slug);
    return inserted.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option.id]);

  const queue = usePortfolioQueue({
    scope: "ad",
    getAccessToken,
    ensureListing: ensureAd,
    onRegistered: handleRegistered,
    getCounts,
    getListingId: () => adIdRef.current,
  });

  // On mount: require a session (anonymous users are sent to sign in) and read
  // the advertiser price the snapshot will use.
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!supabase) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      const { data: priceRow } = await supabase
        .from("subscription_plan_prices")
        .select("amount,currency")
        .eq("plan", "advertiser_premium")
        .maybeSingle();
      if (!cancelled && priceRow) {
        setPriceSnapshot({ amount: Number(priceRow.amount) || 50000, currency: priceRow.currency ?? "UGX" });
      }
      if (!cancelled) setLoading(false);
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && !userId) {
      const next = encodeURIComponent(`/post-ad?type=${option.id}`);
      router.replace(`/login?next=${next}`);
    }
  }, [loading, userId, router, option.id]);

  const update = useCallback(<K extends keyof AdForm>(key: K, value: AdForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }, []);

  const setLink = useCallback((index: number, patch: Partial<AdFormLink>) => {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  }, []);

  const addLink = useCallback(() => {
    setForm((current) => ({ ...current, links: [...current.links, { label: "", url: "" }] }));
  }, []);

  const removeLink = useCallback((index: number) => {
    setForm((current) => ({ ...current, links: current.links.filter((_, i) => i !== index) }));
  }, []);

  const removeExistingMedia = useCallback(async (media: PortfolioMedia) => {
    if (!supabase) return;
    if (media.cloudinaryPublicId) {
      try {
        const token = await getAccessToken();
        await fetch("/api/media/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ publicId: media.cloudinaryPublicId }),
        });
      } catch {
        // A failed abandon should not block removing the local row.
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
  }, [getAccessToken]);

  const validateStep = useCallback(
    (step: number): string => {
      const f = formRef.current;
      if (step === 0) {
        if (f.title.trim().length < 3) return "Give your ad a clear title (at least 3 characters).";
        if (f.description.trim().length < 10) return "Add a short description of what you are promoting.";
        const badLink = f.links.find((link) => link.url.trim() && !/^https?:\/\//i.test(link.url.trim()));
        if (badLink) return "Every link must start with http:// or https://.";
      }
      if (step === 1) {
        const photos = f && existingMediaRef.current.filter((item) => item.kind === "photo" &&
          (!item.cloudinaryPublicId || item.processingStatus === "ready"));
        if (photos.length === 0) return "Add at least one photo so people can see what you are advertising.";
      }
      if (step === 2) {
        if (!f.whatsappNumber.trim() && !f.telegram.trim()) {
          return "Add a WhatsApp number or Telegram handle so clients can reach you.";
        }
      }
      return "";
    },
    []
  );

  const persist = useCallback(
    async (submit: boolean): Promise<boolean> => {
      setSaving(true);
      setError("");
      const fail = (message: string) => {
        setSaving(false);
        setError(message);
        return false;
      };
      if (!supabase || !userIdRef.current) return fail("You are signed out. Sign in again to continue.");

      const currentForm = formRef.current;
      if (submit) {
        for (let step = 0; step < AD_STEPS.length; step += 1) {
          const message = validateStep(step);
          if (message) return fail(message);
        }
        const hasReadyPhoto = existingMediaRef.current.some(
          (item) => item.kind === "photo" && (!item.cloudinaryPublicId || item.processingStatus === "ready")
        );
        if (!hasReadyPhoto) return fail("Add at least one photo before submitting.");
      }

      const id = await ensureAd();
      if (!id) return fail("Your ad could not be created. Please sign in again and retry.");

      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + Math.max(1, currentForm.durationDays) * 86_400_000);
      const payload: Record<string, unknown> = {
        ad_type: option.id,
        title: currentForm.title.trim(),
        category: currentForm.category,
        summary_line: currentForm.summaryLine.trim() || null,
        description: currentForm.description.trim(),
        city: currentForm.city || null,
        neighborhood: currentForm.neighborhood || null,
        country: currentForm.country || "Uganda",
        contact_whatsapp_code: currentForm.whatsappCode || "+256",
        contact_whatsapp_number: currentForm.whatsappNumber.trim() || null,
        contact_telegram: currentForm.telegram.trim() || null,
        links: currentForm.links
          .map((link) => ({ label: link.label.trim() || link.url.trim(), url: link.url.trim() }))
          .filter((link) => link.url),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        amount: priceSnapshot.amount,
        currency: priceSnapshot.currency,
        status: submit ? "pending" : "draft",
      };

      const { error: updateError } = await supabase
        .from("ads")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userIdRef.current);
      if (updateError) return fail(updateError.message);

      setSaving(false);
      return true;
    },
    [ensureAd, option.id, priceSnapshot, validateStep]
  );

  const goToStep = useCallback((step: number) => {
    setError("");
    setCurrentStep(Math.min(AD_STEPS.length - 1, Math.max(0, step)));
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStep < AD_STEPS.length - 1) {
      const message = validateStep(currentStep);
      if (message) {
        setError(message);
        return;
      }
      if (!(await persist(false))) return;
      setCurrentStep((step) => Math.min(AD_STEPS.length - 1, step + 1));
      return;
    }
    if (!(await persist(true))) return;
    setSubmitted(true);
  }, [currentStep, persist, validateStep]);

  const prevStep = useCallback(() => {
    setError("");
    setCurrentStep((step) => Math.max(0, step - 1));
  }, []);

  const startOver = useCallback(() => {
    setAdId(null);
    setSlug("");
    setExistingMedia([]);
    setForm(emptyAdForm(option));
    setCurrentStep(0);
    setSubmitted(false);
    setError("");
  }, [option]);

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

  return {
    option,
    form,
    update,
    setLink,
    addLink,
    removeLink,
    adId,
    userId,
    loading,
    saving,
    submitted,
    error,
    setError,
    currentStep,
    steps: AD_STEPS,
    goToStep,
    nextStep,
    prevStep,
    startOver,
    existingMedia,
    removeExistingMedia,
    queue,
    validateStep,
    cities,
    availableAreas,
    priceSnapshot,
  };
}

export type AdController = ReturnType<typeof useAd>;

// Silence unused-import warnings where a helper is kept for future parity.
void getMediaImageUrl;
void getMediaVideoUrl;
