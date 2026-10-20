"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UGANDA_LOCATIONS } from "@/lib/data/uganda-locations";
import { supabase } from "@/lib/supabase/client";

const MODEL_STEPS = ["About you", "Location", "Experiences & availability", "Media & experience", "Preview"];
const SPECIALIST_STEPS = ["About you", "Location", "Services & rates", "Media & experience", "Preview"];
const MAX_PHOTOS = 9;
const MAX_VIDEOS = 3;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MEDIA_TYPES: Record<"photo" | "video", string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["English", "Luganda", "Swahili", "Runyankole", "Lusoga", "Acholi", "Other"];
const SERVICE_TYPES = [
  { value: "private_chef", label: "Private chef" },
  { value: "home_laundry", label: "Home laundry" },
  { value: "private_massage", label: "Private massage" },
  { value: "other", label: "Other home service" },
];
const SERVICE_OPTIONS: Record<string, string[]> = {
  private_chef: ["Meal preparation", "Private dining", "Event catering", "Meal planning"],
  home_laundry: ["Wash & fold", "Ironing", "Pickup & delivery", "Wardrobe care"],
  private_massage: ["Relaxation massage", "Deep tissue massage", "Sports recovery", "At-home sessions"],
  other: ["At-home service", "Scheduled appointments", "Custom requests"],
};

interface OnboardingForm {
  title: string;
  age: string;
  ageConfirmed: boolean;
  gender: string;
  nationality: string;
  city: string;
  neighborhood: string;
  travelKm: string;
  whatsappNumber: string;
  whatsappCode: string;
  telegram: string;
  serviceType: string;
  services: string[];
  languages: string[];
  rate: string;
  availableDays: string[];
  from: string;
  to: string;
  description: string;
  yearsExperience: string;
  certified: boolean;
  orientation: string;
  bio: string;
}

const emptyForm: OnboardingForm = {
  title: "",
  age: "",
  ageConfirmed: false,
  gender: "",
  nationality: "Ugandan",
  city: "Kampala",
  neighborhood: "",
  travelKm: "10",
  whatsappNumber: "",
  whatsappCode: "+256",
  telegram: "",
  serviceType: "private_chef",
  services: [],
  languages: ["English"],
  rate: "",
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  from: "09:00",
  to: "18:00",
  description: "",
  yearsExperience: "",
  certified: false,
  orientation: "",
  bio: "",
};

const cities = Array.from(new Set(UGANDA_LOCATIONS.map((place) => place.city)));
const nationalities = ["Ugandan", "Kenyan", "Rwandan", "Tanzanian", "South Sudanese", "Other"];
const orientations = ["Straight", "Bi-sexual", "Lesbian", "Gay", "Prefer not to say"];

type PortfolioMedia = { url: string; kind: "photo" | "video"; thumbnailUrl?: string | null };
type PendingMedia = { file: File; kind: "photo" | "video" };

function safeSlug(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "honeybee-profile"}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [accountKind, setAccountKind] = useState<"model" | "specialist" | "agency" | null>(null);
  const [advertiserType, setAdvertiserType] = useState<"fast" | "independent" | "agency" | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<PendingMedia[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PortfolioMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelServiceOptions, setModelServiceOptions] = useState<string[]>([]);
  const [modelServicesError, setModelServicesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isModel = accountKind === "model" || accountKind === "agency";

  const availableAreas = useMemo(
    () => Array.from(new Set(UGANDA_LOCATIONS.filter((place) => place.city === form.city).map((place) => place.area))),
    [form.city]
  );

  useEffect(() => {
    const urls = files.map(({ file }) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

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
        .select("account_kind,name,phone,advertiser_type")
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

      const nextKind = profile.account_kind as "model" | "specialist" | "agency";
      if (nextKind !== "specialist") {
        const { data: serviceOptions, error: serviceOptionsError } = await supabase
          .from("escort_service_options")
          .select("name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (cancelled) return;
        if (serviceOptionsError) {
          setModelServicesError(serviceOptionsError.message);
        } else {
          setModelServiceOptions((serviceOptions ?? []).map((option) => option.name));
        }
      }
      const requestedType = new URLSearchParams(window.location.search).get("type");
      const nextAdvertiserType =
        requestedType === "fast" || requestedType === "independent" || requestedType === "agency"
          ? requestedType
          : profile.advertiser_type === "fast" ||
              profile.advertiser_type === "independent" ||
              profile.advertiser_type === "agency"
            ? profile.advertiser_type
            : nextKind === "agency" ? "agency" : null;
      const nextForm = {
        ...emptyForm,
        title: "",
        whatsappNumber: "",
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
          city: listing.city ?? "Kampala",
          neighborhood: listing.neighborhood ?? "",
          travelKm: listing.travel_km ?? "10",
          whatsappNumber: listing.whatsapp_number ?? nextForm.whatsappNumber,
          whatsappCode: listing.whatsapp_code ?? "+256",
          telegram: listing.telegram ?? "",
          serviceType: listing.service_type ?? nextForm.serviceType,
          services: Array.isArray(listing.services_offered) ? listing.services_offered : [],
          languages: Array.isArray(listing.languages) ? listing.languages : ["English"],
          rate: listing.hourly_rate ? String(listing.hourly_rate) : "",
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
          .select("url,kind,sort_order,thumbnail_url")
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
            url: item.url,
            kind: item.kind === "video" ? "video" as const : "photo" as const,
            thumbnailUrl: item.thumbnail_url,
          }));
          setExistingMedia(
            savedMedia.length > 0
              ? savedMedia
              : (Array.isArray(listing.images) ? listing.images : []).map((url: string) => ({ url, kind: "photo" as const }))
          );
          const savedStep = Number(details.onboardingStep);
          setCurrentStep(
            listing.verification_status === "draft" && Number.isInteger(savedStep)
              ? Math.min(4, Math.max(0, savedStep))
              : listing.verification_status === "draft" ? 0 : 4
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

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleChoice = (key: "services" | "languages" | "availableDays", value: string) => {
    setForm((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const validateStep = (step = currentStep) => {
    if (step === 0 && !form.title.trim()) return "Add the name you want clients to see.";
    if (step === 0 && isModel && (!form.age || Number(form.age) < 18 || Number(form.age) > 100)) {
      return "You must be at least 18 years old to create a model profile.";
    }
    if (step === 0 && isModel && !form.ageConfirmed) return "Confirm that you are 18 or older.";
    if (step === 0 && isModel && !form.gender) return "Choose a gender to continue.";
    if (step === 0 && !isModel && !form.serviceType) return "Choose your main service category.";
    if (step === 1 && (!form.city || !form.neighborhood)) return "Choose your city and neighbourhood.";
    if (step === 1 && form.neighborhood.trim().toLowerCase() === "other") return "Enter your neighbourhood.";
    if (step === 1 && !form.whatsappNumber.trim()) return "Add a WhatsApp number clients can reach.";
    if (step === 2 && form.services.length === 0) return "Choose at least one service you offer.";
    if (step === 2 && isModel && modelServicesError) return "The hot-offer list could not be loaded. Refresh the page and try again.";
    if (step === 2 && isModel && modelServiceOptions.length === 0) return "No hot offers are available right now. Please try again later.";
    if (step === 2 && form.languages.length === 0) return "Choose at least one language.";
    if (step === 2 && !isModel && (!form.rate || Number(form.rate) < 5000 || Number(form.rate) > 999999999)) {
      return "Set an hourly rate between UGX 5,000 and UGX 999,999,999.";
    }
    if (step === 2 && form.availableDays.length === 0) return "Choose at least one day you are available.";
    if (step === 3 && form.description.trim().length < 40) return "Add at least 40 characters describing your profile.";
    if (step === 3 && existingMedia.filter((item) => item.kind === "photo").length + files.filter((item) => item.kind === "photo").length === 0) return "Upload at least one portfolio photo.";
    if (step === 3 && existingMedia.filter((item) => item.kind === "video").length + files.filter((item) => item.kind === "video").length === 0) return "Upload at least one portfolio video.";
    return "";
  };

  const persist = async (submit = false) => {
    if (!supabase || !accountKind) {
      setError("Sign in and configure Supabase before saving your profile.");
      return false;
    }

    const validationError = submit
      ? [0, 1, 2, 3].map((step) => validateStep(step)).find(Boolean) ?? ""
      : validateStep();
    if (validationError) {
      setError(validationError);
      return false;
    }

    if (submit && (
      existingMedia.filter((item) => item.kind === "photo").length + files.filter((item) => item.kind === "photo").length === 0
      || existingMedia.filter((item) => item.kind === "video").length + files.filter((item) => item.kind === "video").length === 0
    )) {
      setError("Submit at least one portfolio photo and one portfolio video.");
      return false;
    }

    setSaving(true);
    setError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setSaving(false);
      setError(authError?.message ?? "Your session expired. Sign in again to save your profile.");
      return false;
    }

    const profileSlug = slug || safeSlug(form.title);
    const availability = DAYS.map((label) => ({
      label,
      on: form.availableDays.includes(label),
      from: form.from,
      to: form.to,
    }));
    const payload = {
      user_id: authData.user.id,
      title: form.title.trim(),
      slug: profileSlug,
      kind: isModel ? "escort" : "service",
      escort_tier: isModel ? "premium" : "standard",
      category: isModel ? form.gender.toLowerCase() : "service",
      service_type: isModel ? null : form.serviceType,
      age: isModel ? Number(form.age) : null,
      gender: form.gender || null,
      nationality: form.nationality,
      city: form.city,
      neighborhood: form.neighborhood,
      hourly_rate: isModel ? 0 : Number(form.rate) || 0,
      monthly_price: isModel ? 0 : Number(form.rate) || 0,
      currency: "UGX",
      summary_line: form.bio.trim() || form.description.trim().slice(0, 140),
      description: form.description.trim() || "Profile in progress.",
      services_offered: form.services,
      languages: form.languages,
      availability,
      verification_status: submit ? "pending" : "draft",
      verification_notes: null,
      whatsapp_number: form.whatsappNumber.replace(/\D/g, ""),
      whatsapp_code: form.whatsappCode,
      telegram: form.telegram.trim() || null,
      telegram_code: "+256",
      cover_image: existingMedia.find((item) => item.kind === "photo")?.url ?? null,
      images: existingMedia.filter((item) => item.kind === "photo").map((item) => item.url),
      travel_km: form.travelKm,
      advertiser_type: isModel ? advertiserType ?? "independent" : null,
      has_certificate: form.certified,
      experience_band: form.yearsExperience
        ? `${form.yearsExperience} ${Number(form.yearsExperience) === 1 ? "year" : "years"} experience`
        : null,
      profile_details: {
        yearsExperience: form.yearsExperience,
        certified: form.certified,
        orientation: form.orientation,
        advertiserType: isModel ? advertiserType ?? "independent" : null,
        ageConfirmed: form.ageConfirmed,
        onboardingStep: submit ? 4 : Math.min(currentStep + 1, 4),
      },
    };

    let savedListingId = listingId;
    if (savedListingId) {
      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", savedListingId)
        .eq("user_id", authData.user.id);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return false;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("listings")
        .insert(payload)
        .select("id")
        .single();
      if (insertError || !inserted) {
        setSaving(false);
        setError(insertError?.message ?? "Could not create your profile draft.");
        return false;
      }
      savedListingId = inserted.id;
      setListingId(inserted.id);
      setSlug(profileSlug);
    }

    if (files.length > 0 && savedListingId) {
      const uploaded: Array<{ path: string; url: string; kind: "photo" | "video" }> = [];
      for (const item of files) {
        const { file, kind } = item;
        const path = `${authData.user.id}/${savedListingId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("honeybee-profile-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) {
          if (uploaded.length > 0) {
            const { error: cleanupError } = await supabase.storage
              .from("honeybee-profile-media")
              .remove(uploaded.map((item) => item.path));
            if (cleanupError) console.error("Could not remove partial portfolio uploads:", cleanupError.message);
          }
          setSaving(false);
          setError(uploadError.message);
          return false;
        }
        const { data: publicUrl } = supabase.storage.from("honeybee-profile-media").getPublicUrl(path);
        uploaded.push({ path, url: publicUrl.publicUrl, kind });
      }

      const mediaRows = uploaded.map((item, index) => ({
        listing_id: savedListingId,
        url: item.url,
        kind: item.kind,
        sort_order: existingMedia.length + index,
        processing_status: item.kind === "video" ? "pending" : "ready",
        ...(item.kind === "video"
          ? { original_url: item.url, source_path: item.path }
          : {}),
      }));
      const { error: mediaError } = await supabase.from("profile_media").insert(mediaRows);
      if (mediaError) {
        const { error: cleanupError } = await supabase.storage
          .from("honeybee-profile-media")
          .remove(uploaded.map((item) => item.path));
        if (cleanupError) console.error("Could not remove portfolio uploads after media save failed:", cleanupError.message);
        setSaving(false);
        setError(mediaError.message);
        return false;
      }

      const allMedia = [...existingMedia, ...uploaded.map(({ url, kind }) => ({ url, kind }))];
      const allImages = allMedia.filter((item) => item.kind === "photo").map((item) => item.url);
      const { error: imageUpdateError } = await supabase
        .from("listings")
        .update({ images: allImages, cover_image: allImages[0] })
        .eq("id", savedListingId);
      if (imageUpdateError) {
        setSaving(false);
        setError(imageUpdateError.message);
        return false;
      }
      setExistingMedia(allMedia);
      setFiles([]);
    }

    setSaving(false);
    return true;
  };

  const nextStep = async () => {
    if (currentStep < 4) {
      if (!(await persist())) return;
      setCurrentStep((step) => Math.min(4, step + 1));
      return;
    }

    if (!(await persist(true))) return;
    setSubmitted(true);
  };

  const selectedServiceOptions = isModel ? modelServiceOptions : SERVICE_OPTIONS[form.serviceType] ?? [];
  const steps = isModel ? MODEL_STEPS : SPECIALIST_STEPS;
  const stepTitle = [
    isModel ? "Set up your model profile" : "Set up your service profile",
    "Where clients can find you",
    isModel ? "What experiences do you offer?" : "What services do you provide?",
    "Tell your story and add photos",
    "Review before submitting",
  ][currentStep];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-airbnb-coral" />
        <span className="ml-2 text-sm text-muted-foreground">Loading your saved profile...</span>
      </div>
    );
  }

  if (!accountKind) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p role="alert" className="text-sm text-destructive">{error || "Could not load your provider account."}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-airbnb-coral hover:underline">Sign in again</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-12">
        <Card className="w-full rounded-3xl p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <Badge variant="secondary" className="mt-5">Submitted for review</Badge>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Your Honeybee profile is in review</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Thanks, {form.title}. Your ad is saved but won&apos;t appear in discovery until a moderator verifies it. You can return to onboarding to update it while it is awaiting review. Once it is approved, you can pay to feature it.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/provider/onboarding">
              <Button variant="outline" className="w-full rounded-xl">Edit profile</Button>
            </Link>
            {accountKind === "agency" && (
              <Button
                onClick={() => {
                  setListingId(null);
                  setSlug("");
                  setForm({ ...emptyForm, serviceType: "" });
                  setFiles([]);
                  setExistingMedia([]);
                  setCurrentStep(0);
                  setSubmitted(false);
                }}
                className="w-full rounded-xl bg-[#d3444d] font-bold text-white hover:bg-[#ad3039]"
              >
                Post another ad
              </Button>
            )}
            <Link href="/">
              <Button className="w-full rounded-xl bg-airbnb-coral font-bold text-white">Explore Honeybee</Button>
            </Link>
            {listingId && (
              <Link href={`/subscribe?listing_id=${encodeURIComponent(listingId)}`}>
                <Button className="w-full rounded-xl bg-[#d3444d] font-bold text-white hover:bg-[#ad3039]">
                  Choose ad feature
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold">
          <span className="uppercase tracking-wide text-muted-foreground">
            {isModel ? "Model onboarding" : "Service provider onboarding"} · Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-airbnb-coral">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-airbnb-coral transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
          {steps.map((step, index) => (
            <div key={step} className={`text-[11px] ${index <= currentStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              <span className={`mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${index < currentStep ? "bg-emerald-600 text-white" : index === currentStep ? "bg-airbnb-coral text-white" : "bg-muted"}`}>
                {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
        <CardHeader className="bg-gradient-to-br from-rose-50 via-white to-amber-50 pb-5 dark:from-neutral-900 dark:via-card dark:to-neutral-900">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Step {currentStep + 1}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">{steps[currentStep]}</span>
          </div>
          <CardTitle className="mt-2 text-2xl font-extrabold tracking-tight">{stepTitle}</CardTitle>
          <CardDescription className="text-sm">
            {currentStep === 0 && "Choose the public details that help clients recognize and understand your profile."}
            {currentStep === 1 && "Your neighbourhood and contact number help clients discover and reach you."}
            {currentStep === 2 && (isModel
              ? "Choose the experiences you offer and your availability. Discuss pricing directly with clients in chat."
              : "Select services, set your starting rate, and choose when you are available.")}
            {currentStep === 3 && "A clear introduction and original photos help build trust with clients."}
            {currentStep === 4 && "Check your details. Profiles stay hidden from discovery until an admin verifies them."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-7">
          {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          {currentStep === 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Public display name">
                <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={isModel ? "e.g. Maya K." : "e.g. Chef Samuel K."} maxLength={120} />
              </Field>
              {isModel ? (
                <>
                  <Field label="Age" hint="You must be at least 18.">
                    <Input type="number" min={18} max={100} value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="25" />
                  </Field>
                  <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm sm:col-span-2">
                    <input type="checkbox" checked={form.ageConfirmed} onChange={(event) => update("ageConfirmed", event.target.checked)} className="h-4 w-4 accent-airbnb-coral" />
                    I confirm that I am 18 years old or older.
                  </label>
                  <Field label="Gender">
                    <RadioGroup value={form.gender} onChange={(value) => update("gender", value)} options={["Female", "Male", "Non-binary"]} />
                  </Field>
                  <Field label="Orientation (optional)">
                    <SelectInput value={form.orientation} onChange={(value) => update("orientation", value)}>
                      <option value="">Choose an option</option>
                      {orientations.map((orientation) => <option key={orientation} value={orientation}>{orientation}</option>)}
                    </SelectInput>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Main service category">
                    <SelectInput value={form.serviceType} onChange={(value) => update("serviceType", value)}>
                      {SERVICE_TYPES.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="Years of experience">
                    <Input type="number" min={0} max={60} value={form.yearsExperience} onChange={(event) => update("yearsExperience", event.target.value)} placeholder="5" />
                  </Field>
                  <Field label="Nationality">
                    <SelectInput value={form.nationality} onChange={(value) => update("nationality", value)}>
                      {nationalities.map((nationality) => <option key={nationality}>{nationality}</option>)}
                    </SelectInput>
                  </Field>
                </>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City / district">
                  <SelectInput
                    value={form.city}
                    onChange={(value) => {
                      update("city", value);
                      update("neighborhood", "");
                    }}
                  >
                    {cities.map((city) => <option key={city}>{city}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Neighbourhood">
                  <SelectInput
                    value={availableAreas.includes(form.neighborhood) ? form.neighborhood : form.neighborhood ? "Other" : ""}
                    onChange={(value) => update("neighborhood", value)}
                  >
                    <option value="">Choose neighbourhood</option>
                    {availableAreas.map((area) => <option key={area}>{area}</option>)}
                    <option value="Other">Other</option>
                  </SelectInput>
                  {(form.neighborhood === "Other" ||
                    (!!form.neighborhood && !availableAreas.includes(form.neighborhood))) && (
                    <Input className="mt-2" placeholder="Enter your neighbourhood" onChange={(event) => update("neighborhood", event.target.value)} />
                  )}
                </Field>
              </div>
              <Field label="Maximum travel distance">
                <RadioGroup
                  value={form.travelKm}
                  onChange={(value) => update("travelKm", value)}
                  options={["5", "10", "20", "50", "anywhere"]}
                  labels={["5 km", "10 km", "20 km", "50 km", "Anywhere in Uganda"]}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp number">
                  <div className="flex gap-2">
                    <SelectInput value={form.whatsappCode} onChange={(value) => update("whatsappCode", value)} className="w-28">
                      <option>+256</option><option>+254</option><option>+250</option><option>+255</option>
                    </SelectInput>
                    <Input value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} placeholder="700 000 000" inputMode="tel" />
                  </div>
                </Field>
                <Field label="Telegram username (optional)">
                  <Input value={form.telegram} onChange={(event) => update("telegram", event.target.value)} placeholder="@username" />
                </Field>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              {!isModel && (
                <Field label="Service category">
                  <SelectInput value={form.serviceType} onChange={(value) => { update("serviceType", value); update("services", []); }}>
                    {SERVICE_TYPES.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
                  </SelectInput>
                </Field>
              )}
              <Field
                label={isModel ? "Hot offers" : "Services offered"}
                hint={isModel ? "Choose what you offer. Clients can discuss details and pricing with you in chat." : "Choose all that apply."}
              >
                {isModel && modelServicesError ? (
                  <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    Could not load hot offers: {modelServicesError}
                  </p>
                ) : selectedServiceOptions.length > 0 ? (
                  <CheckboxGrid
                    options={selectedServiceOptions}
                    selected={form.services}
                    onToggle={(service) => toggleChoice("services", service)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isModel ? "Loading hot offers…" : "No services available for this category."}
                  </p>
                )}
              </Field>
              <Field label="Languages">
                <CheckboxGrid options={LANGUAGES} selected={form.languages} onToggle={(language) => toggleChoice("languages", language)} />
              </Field>
              {!isModel && (
                <Field label="Starting rate per hour (UGX)">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" aria-label="Decrease hourly rate" onClick={() => update("rate", String(Math.max(5000, (Number(form.rate) || 50000) - 5000)))}>-</Button>
                    <Input type="number" min={5000} max={999999999} step={5000} value={form.rate} onChange={(event) => update("rate", event.target.value)} placeholder="50,000" className="max-w-xs text-center font-semibold" />
                    <Button type="button" variant="outline" size="icon" aria-label="Increase hourly rate" onClick={() => update("rate", String((Number(form.rate) || 45000) + 5000))}>+</Button>
                    <span className="text-xs text-muted-foreground">UGX / hour</span>
                  </div>
                </Field>
              )}
              <Field label="Available days" hint="Select at least one day.">
                <CheckboxGrid options={DAYS} selected={form.availableDays} onToggle={(day) => toggleChoice("availableDays", day)} columns={4} />
              </Field>
              <div className="grid max-w-sm grid-cols-2 gap-4">
                <Field label="From"><Input type="time" value={form.from} onChange={(event) => update("from", event.target.value)} /></Field>
                <Field label="Until"><Input type="time" value={form.to} onChange={(event) => update("to", event.target.value)} /></Field>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <Field label={isModel ? "About your profile" : "About your work"} hint="At least 40 characters. Do not include private identity details.">
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  rows={5}
                  maxLength={2500}
                  placeholder={isModel ? "Introduce yourself, your interests, and what clients can expect..." : "Tell clients about your experience, approach, and the quality of your work..."}
                  className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/2500</div>
              </Field>
              {!isModel && (
                <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
                  <input
                    id="certified"
                    type="checkbox"
                    checked={form.certified}
                    onChange={(event) => update("certified", event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input accent-emerald-600"
                  />
                  <label htmlFor="certified" className="text-sm">
                    <span className="font-semibold">I have relevant training or certification</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Only claim qualifications you can confirm during review.</span>
                  </label>
                </div>
              )}
              <Field
                label="Portfolio photos and videos"
                hint="Required: at least 1 photo and 1 video. Upload up to 9 JPEG, PNG, or WebP photos (10 MB each) and up to 3 MP4, WebM, or QuickTime videos (100 MB each). For best mobile playback, use H.264 MP4; WebM and QuickTime playback varies by device. Use media you have permission to publish."
              >
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center transition hover:border-airbnb-coral">
                  <ImagePlus className="mb-2 h-7 w-7 text-airbnb-coral" />
                  <span className="text-sm font-semibold">Choose photos and videos</span>
                  <span className="mt-1 text-xs text-muted-foreground">Select one or more files from your device</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      const counts = {
                        photo: existingMedia.filter((item) => item.kind === "photo").length + files.filter((item) => item.kind === "photo").length,
                        video: existingMedia.filter((item) => item.kind === "video").length + files.filter((item) => item.kind === "video").length,
                      };
                      const errors: string[] = [];
                      const additions: PendingMedia[] = [];
                      for (const file of selected) {
                        const kind = MEDIA_TYPES.photo.includes(file.type)
                          ? "photo"
                          : MEDIA_TYPES.video.includes(file.type) ? "video" : null;
                        if (!kind) {
                          errors.push("Choose JPEG, PNG, or WebP photos and MP4, WebM, or QuickTime videos.");
                          continue;
                        }
                        const maxSize = kind === "photo" ? MAX_PHOTO_SIZE : MAX_VIDEO_SIZE;
                        if (file.size > maxSize) {
                          errors.push(kind === "photo" ? "Each photo must be 10 MB or smaller." : "Each video must be 100 MB or smaller.");
                          continue;
                        }
                        const maxCount = kind === "photo" ? MAX_PHOTOS : MAX_VIDEOS;
                        if (counts[kind] >= maxCount) {
                          errors.push(kind === "photo" ? "A profile can have up to 9 photos." : "A profile can have up to 3 videos.");
                          continue;
                        }
                        additions.push({ file, kind });
                        counts[kind] += 1;
                      }
                      setFiles((current) => [...current, ...additions]);
                      setError(errors.join(" "));
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {(existingMedia.length > 0 || previews.length > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {existingMedia.map((item, index) => (
                      <div key={item.url} className="relative aspect-square overflow-hidden rounded-xl bg-black">
                        {item.kind === "video" ? (
                          <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Portfolio video ${index + 1}`} />
                        ) : (
                          <Image src={item.url} alt={`Portfolio photo ${index + 1}`} fill unoptimized className="object-cover" />
                        )}
                        {item.kind === "photo" && existingMedia.filter((media) => media.kind === "photo")[0]?.url === item.url && <Badge className="absolute left-1 top-1 text-[10px]">Cover</Badge>}
                      </div>
                    ))}
                    {previews.map((url, index) => (
                      <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-black">
                        {files[index]?.kind === "video" ? (
                          <video src={url} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`New portfolio video ${index + 1}`} />
                        ) : (
                          <Image src={url} alt={`New portfolio photo ${index + 1}`} fill unoptimized className="object-cover" />
                        )}
                        <button type="button" aria-label={`Remove selected media ${index + 1}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {existingMedia.filter((item) => item.kind === "photo").length + files.filter((item) => item.kind === "photo").length}/{MAX_PHOTOS} photos · {existingMedia.filter((item) => item.kind === "video").length + files.filter((item) => item.kind === "video").length}/{MAX_VIDEOS} videos
                </p>
              </Field>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold">Your profile is reviewed before it is published</p>
                  <p className="mt-1 text-xs">Only verified profiles appear in public search. Your photos and videos will be visible with the profile after approval.</p>
                </div>
              </div>
              <ReviewRow icon={<UserRound className="h-4 w-4" />} label="Profile" value={`${form.title}${isModel ? ` · ${form.age} years · ${form.gender}` : ` · ${SERVICE_TYPES.find((item) => item.value === form.serviceType)?.label}`} `} />
              <ReviewRow icon={<MapPin className="h-4 w-4" />} label="Location" value={`${form.neighborhood}, ${form.city} · WhatsApp ${form.whatsappCode} ${form.whatsappNumber}`} />
              <ReviewRow icon={<Sparkles className="h-4 w-4" />} label="Services" value={`${form.services.join(", ")} · ${form.languages.join(", ")}`} />
              <ReviewRow
                icon={<Utensils className="h-4 w-4" />}
                label={isModel ? "Availability" : "Rate & availability"}
                value={`${isModel ? "" : `UGX ${Number(form.rate || 0).toLocaleString()} / hour · `}${form.availableDays.join(", ")}`}
              />
              <div className="rounded-2xl border border-border p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">About</p>
                <p className="text-sm leading-relaxed">{form.description || "Add a description before submitting."}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {[
                  ...existingMedia.map((item) => ({ ...item, previewUrl: item.url })),
                  ...previews.map((url, index) => ({
                    url,
                    previewUrl: url,
                    kind: files[index]?.kind ?? "photo" as const,
                    thumbnailUrl: null,
                  })),
                ].slice(0, 5).map((item, index) => (
                  <div key={`${item.url}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-black">
                    {item.kind === "video" ? (
                      <video src={item.previewUrl} poster={item.thumbnailUrl ?? undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Profile video ${index + 1}`} />
                    ) : (
                      <Image src={item.previewUrl} alt={`Profile photo ${index + 1}`} fill unoptimized className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={saving || currentStep === 0}
              onClick={() => { setError(""); setCurrentStep((step) => Math.max(0, step - 1)); }}
              className="rounded-xl"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void nextStep()}
              className="rounded-xl bg-airbnb-coral font-bold text-white hover:bg-[#AD3039]"
            >
              {saving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : currentStep === 4 ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit for review</> : <>Save &amp; continue <ChevronRight className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Your progress is saved as you continue. You can return to edit an unverified profile.</p>
        </CardContent>
      </Card>

      <div className="mt-5 flex justify-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit onboarding
        </Link>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  className,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className ?? ""}`}
    >
      {children}
    </select>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
  labels = options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => (
        <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${value === option ? "border-airbnb-coral bg-rose-50 text-foreground dark:bg-rose-950/20" : "border-border hover:border-foreground/40"}`}>
          <input type="radio" name={`choice-${options.join("-")}`} checked={value === option} onChange={() => onChange(option)} className="accent-airbnb-coral" />
          {labels[index]}
        </label>
      ))}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
  columns = 2,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  columns?: number;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
      {options.map((option) => (
        <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${selected.includes(option) ? "border-airbnb-coral bg-rose-50 dark:bg-rose-950/20" : "border-border hover:border-foreground/40"}`}>
          <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} className="h-4 w-4 accent-airbnb-coral" />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border p-4">
      <span className="mt-0.5 text-airbnb-coral">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
