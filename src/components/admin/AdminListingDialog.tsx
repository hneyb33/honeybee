"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { LoaderCircle, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LocationCascader } from "@/components/location/LocationCascader";
import {
  LANGUAGES,
  SERVICE_OPTIONS,
  SERVICE_TYPES,
  nationalities,
  orientations,
} from "@/app/provider/onboarding/onboarding-config";
import { countryCodeForName } from "@/lib/locations";
import { EAST_AFRICAN_COUNTRIES, resolveLocationCoordinates } from "@/lib/data/uganda-locations";
import { MEDIA_ACCEPT_ATTRIBUTE, MEDIA_POLICY } from "@/lib/media-policy";
import { getMediaImageUrl, getMediaThumbnailUrl, getMediaVideoUrl } from "@/lib/media-urls";
import { supabase } from "@/lib/supabase/client";

type ListingSummary = {
  id: string;
  user_id: string | null;
  title: string;
  kind: string;
  city: string;
  neighborhood: string;
  hourly_rate: number;
};

type Profile = { id: string; name: string; email: string | null; phone: string | null; account_kind: string; role: string };
type ListingDetails = Record<string, unknown> & ListingSummary & { slug: string; description: string };
type RelatedRows = Record<string, unknown>[];

/**
 * Mirrors the provider onboarding form (`onboarding-config.ts`): every choice
 * the wizard offers from a fixed list is a dropdown or chip toggle here too,
 * locations come from the shared gazetteer, and portfolio media goes through
 * the same R2/Stream pipeline via the admin media relay instead of pasted URLs.
 */
type ListingForm = {
  name: string;
  email: string;
  phone: string;
  title: string;
  age: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  orientation: string;
  serviceType: string;
  travelKm: string;
  whatsappCode: string;
  whatsappNumber: string;
  telegram: string;
  yearsExperience: string;
  certified: boolean;
  summary: string;
  description: string;
  about: string;
  hourlyRate: string;
  monthlyPrice: string;
};

type LocationState = {
  country: string;
  city: string;
  neighborhood: string;
  locationCode: string;
};

type UploadState = {
  id: string;
  name: string;
  state: "uploading" | "done" | "error";
  error?: string;
};

const GENDERS = ["Female", "Male", "Non-binary"];

const blankForm = (kind: "escort" | "service"): ListingForm => ({
  name: "",
  email: "",
  phone: "",
  title: "",
  age: "",
  gender: "",
  nationality: "Ugandan",
  ethnicity: "",
  orientation: "",
  serviceType: kind === "service" ? "private_chef" : "",
  travelKm: "10",
  whatsappCode: "+256",
  whatsappNumber: "",
  telegram: "",
  yearsExperience: "",
  certified: false,
  summary: "",
  description: "",
  about: "",
  hourlyRate: "50000",
  monthlyPrice: "150000",
});

const blankLocation: LocationState = {
  country: "Uganda",
  city: "Kampala",
  neighborhood: "",
  locationCode: "",
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function fieldLabel(key: string) {
  return key.replaceAll("_", " ");
}

export function AdminListingDialog({
  open,
  listing,
  createKind,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  listing: ListingSummary | null;
  createKind?: "escort" | "service";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  // A listing created through this dialog stays open in edit mode so the
  // admin can immediately attach portfolio media (uploads need a listing id).
  const [created, setCreated] = useState<ListingSummary | null>(null);
  const target = listing ?? created;
  const targetId = target?.id ?? null;
  const kind = (target?.kind ?? createKind ?? "escort") as "escort" | "service";
  const isEscort = kind === "escort";

  const [details, setDetails] = useState<ListingDetails | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<RelatedRows>([]);
  const [offerings, setOfferings] = useState<RelatedRows>([]);
  const [references, setReferences] = useState<RelatedRows>([]);
  const [form, setForm] = useState<ListingForm>(() => blankForm(kind));
  const [services, setServices] = useState<string[]>([]);
  const [languageList, setLanguageList] = useState<string[]>(["English"]);
  const [location, setLocation] = useState<LocationState>(blankLocation);
  const [modelServiceOptions, setModelServiceOptions] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const update = (key: keyof ListingForm, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Reset the transient "created in this dialog" listing once the dialog closes.
  useEffect(() => {
    if (!open) {
      setCreated(null);
      setUploads([]);
      setNotice("");
    }
  }, [open]);

  // Model "services" come from the admin-managed escort_service_options table,
  // exactly like the onboarding wizard.
  useEffect(() => {
    if (!open || !isEscort || !supabase) return;
    if (modelServiceOptions.length > 0) return;
    void supabase
      .from("escort_service_options")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setModelServiceOptions((data ?? []).map((row) => String(row.name))));
  }, [open, isEscort, modelServiceOptions.length]);

  const loadRecords = useCallback(async (id: string) => {
    if (!supabase) return;
    const client = supabase;
    const [listingResult, mediaResult, offeringsResult, referencesResult] = await Promise.all([
      client.from("listings").select("*").eq("id", id).single(),
      client.from("profile_media").select("*").eq("listing_id", id).order("sort_order"),
      client.from("profile_offerings").select("*").eq("listing_id", id).order("sort_order"),
      client.from("profile_references").select("*").eq("listing_id", id).order("created_at"),
    ]);
    if (listingResult.error) {
      setError(listingResult.error.message);
      return;
    }
    const listingData = listingResult.data as unknown as ListingDetails;
    setDetails(listingData);
    setMedia((mediaResult.data ?? []) as RelatedRows);
    setOfferings((offeringsResult.data ?? []) as RelatedRows);
    setReferences((referencesResult.data ?? []) as RelatedRows);

    let loadedProfile: Profile | null = null;
    if (listingData.user_id) {
      const { data, error: profileError } = await client
        .from("profiles")
        .select("id,name,email,phone,account_kind,role")
        .eq("id", listingData.user_id)
        .maybeSingle();
      if (profileError) setError(profileError.message);
      loadedProfile = data as Profile | null;
      setProfile(loadedProfile);
    }

    const detailsJson = (listingData.profile_details ?? {}) as Record<string, unknown>;
    setForm({
      ...blankForm(kind),
      title: listingData.title ?? "",
      name: loadedProfile?.name ?? "",
      phone: loadedProfile?.phone ?? "",
      age: listingData.age == null ? "" : String(listingData.age),
      gender: String(listingData.gender ?? ""),
      nationality: String(listingData.nationality ?? "Ugandan"),
      ethnicity: String(listingData.ethnicity ?? ""),
      orientation: String(detailsJson.orientation ?? ""),
      serviceType: String(listingData.service_type ?? (isEscort ? "" : "private_chef")),
      travelKm: String(listingData.travel_km ?? "10"),
      whatsappCode: String(listingData.whatsapp_code ?? "+256"),
      whatsappNumber: String(listingData.whatsapp_number ?? ""),
      telegram: String(listingData.telegram ?? ""),
      yearsExperience: String(detailsJson.yearsExperience ?? ""),
      certified: Boolean(detailsJson.certified),
      summary: String(listingData.summary_line ?? ""),
      description: String(listingData.description ?? ""),
      about: String(listingData.about_me ?? ""),
      hourlyRate: String(listingData.hourly_rate ?? ""),
      monthlyPrice: String(listingData.monthly_price ?? ""),
    });
    setServices(stringList(listingData.services_offered));
    setLanguageList(stringList(listingData.languages).length > 0 ? stringList(listingData.languages) : ["English"]);
    setLocation({
      country: String(listingData.country ?? "Uganda"),
      city: String(listingData.city ?? "Kampala"),
      neighborhood: String(listingData.neighborhood ?? ""),
      locationCode: String(listingData.location_code ?? ""),
    });
  }, [kind, isEscort]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (!targetId) {
      // Fresh create: blank form in edit mode right away.
      setEditing(true);
      setDetails(null);
      setProfile(null);
      setMedia([]);
      setOfferings([]);
      setReferences([]);
      setForm(blankForm(kind));
      setServices([]);
      setLanguageList(["English"]);
      setLocation(blankLocation);
      return;
    }
    setEditing(false);
    let cancelled = false;
    setLoading(true);
    void loadRecords(targetId).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
    // Keyed on the id, not the `listing` object identity: the parent rebuilds
    // that inline object on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetId, kind]);

  const numeric = (value: string, label: string, minimum: number) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error(`${label} must be a whole number of at least ${minimum}.`);
    return parsed;
  };

  const buildPayload = () => {
    const coords = resolveLocationCoordinates(location.country, location.city, location.neighborhood);
    const yearsExperience = form.yearsExperience.trim();
    return {
      title: form.title.trim(),
      kind,
      escort_tier: String(details?.escort_tier ?? (isEscort ? "premium" : "standard")),
      category: isEscort ? (form.gender.trim().toLowerCase() || "female") : "service",
      service_type: isEscort ? null : (form.serviceType.trim() || "other"),
      age: isEscort ? Number(form.age) : null,
      gender: form.gender.trim() || null,
      nationality: form.nationality.trim() || null,
      ethnicity: form.ethnicity.trim() || null,
      country: location.country,
      city: location.city,
      neighborhood: location.neighborhood,
      location_code: location.locationCode.trim() || null,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      travel_km: form.travelKm.trim() || null,
      hourly_rate: isEscort ? 0 : numeric(form.hourlyRate, "Hourly rate", 0),
      monthly_price: isEscort ? 0 : numeric(form.monthlyPrice || "0", "Monthly price", 0),
      whatsapp_code: form.whatsappCode.trim() || "+256",
      whatsapp_number: form.whatsappNumber.replace(/\D/g, "") || null,
      telegram: form.telegram.trim() || null,
      summary_line: form.summary.trim() || form.description.trim().slice(0, 140) || null,
      description: form.description.trim(),
      about_me: form.about.trim() || null,
      services_offered: services,
      languages: languageList,
      experience_band: yearsExperience
        ? `${yearsExperience} ${Number(yearsExperience) === 1 ? "year" : "years"} experience`
        : null,
      profile_details: {
        ...((details?.profile_details as Record<string, unknown> | undefined) ?? {}),
        yearsExperience,
        certified: form.certified,
        orientation: form.orientation,
      },
    };
  };

  const validate = () => {
    if (!form.title.trim() || !location.city.trim() || !location.neighborhood.trim() || form.description.trim().length < 20) {
      return "Enter a title, city, neighborhood, and a description of at least 20 characters.";
    }
    if (isEscort && (!form.gender || !GENDERS.includes(form.gender))) return "Choose a gender.";
    if (isEscort && (!form.age || !Number.isInteger(Number(form.age)) || Number(form.age) < 18 || Number(form.age) > 100)) {
      return "Model profiles must be for adults aged 18 or older.";
    }
    if (!isEscort && !form.serviceType.trim()) return "Choose the main service category.";
    if (services.length === 0) return "Choose at least one service option.";
    if (!target && (!form.name.trim() || !form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) {
      return "Enter the account holder's name and a valid email address for the invitation.";
    }
    return null;
  };

  const save = async () => {
    if (!supabase) return setError("Configure Supabase to save profile details.");
    setError("");
    const validation = validate();
    if (validation) return setError(validation);
    setSaving(true);
    try {
      const payload = buildPayload();
      if (target) {
        const { error: updateError } = await supabase
          .from("listings")
          // verification_status is deliberately NOT part of the payload: an
          // admin edit must never silently un-verify a moderated profile. The
          // slug stays untouched - it is the public URL of the profile.
          .update(payload)
          .eq("id", target.id);
        if (updateError) throw updateError;
        if (profile) {
          const { error: profileError } = await supabase.rpc("admin_update_profile", {
            p_user_id: profile.id,
            p_name: form.name.trim() || profile.name,
            p_phone: form.phone.trim() || profile.phone,
            p_account_kind: profile.account_kind,
          });
          if (profileError) throw profileError;
        }
        onSaved();
        onOpenChange(false);
      } else {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError || !authData.session?.access_token) throw authError ?? new Error("Your admin session expired. Sign in again.");
        const response = await fetch("/api/admin/listings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.session.access_token}`,
          },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            name: form.name.trim(),
            phone: form.phone.trim(),
            accountKind: isEscort ? "model" : "specialist",
            listing: {
              ...payload,
              slug: `${form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`,
              verification_status: "pending",
            },
          }),
        });
        const result = await response.json() as { error?: string; userId?: string };
        if (!response.ok) throw new Error(result.error ?? "The account and listing could not be created.");

        // Keep the dialog open on the freshly created listing so media can be
        // uploaded straight away through the relay (uploads need a listing id).
        if (result.userId) {
          const { data: createdRow } = await supabase
            .from("listings")
            .select("id,user_id,title,kind,city,neighborhood,hourly_rate")
            .eq("user_id", result.userId)
            .maybeSingle();
          if (createdRow) {
            setCreated(createdRow as ListingSummary);
            setEditing(false);
            setNotice("Account invited and profile created. Upload portfolio photos and videos below, then Save changes.");
          }
        }
        onSaved();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  // --- Portfolio media via the admin relay (R2 + queue / Stream pipeline) ----
  const refreshMedia = useCallback(async () => {
    if (!supabase || !targetId) return;
    const [{ data: rows }, { data: row }] = await Promise.all([
      supabase.from("profile_media").select("*").eq("listing_id", targetId).order("sort_order"),
      supabase.from("listings").select("cover_image,images").eq("id", targetId).maybeSingle(),
    ]);
    setMedia((rows ?? []) as RelatedRows);
    if (row && details) setDetails({ ...details, cover_image: (row as { cover_image?: string }).cover_image });
  }, [targetId, details]);

  const uploadFiles = async (selected: File[]) => {
    if (!supabase || !targetId) return;
    setError("");
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    if (!token) return setError("Your admin session expired. Sign in again.");
    for (const file of selected) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setUploads((current) => [...current, { id, name: file.name, state: "uploading" }]);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`/api/admin/listings/${targetId}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
        const result = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) throw new Error(result?.error ?? `Upload failed (HTTP ${response.status}).`);
        setUploads((current) => current.map((item) => (item.id === id ? { ...item, state: "done" } : item)));
      } catch (uploadError) {
        setUploads((current) => current.map((item) =>
          item.id === id ? { ...item, state: "error", error: uploadError instanceof Error ? uploadError.message : "Upload failed." } : item
        ));
      }
    }
    await refreshMedia();
    onSaved();
  };

  const photoCount = media.filter((row) => row.kind === "photo").length;
  const videoCount = media.filter((row) => row.kind === "video").length;

  const selectField = (label: string, value: string, onChange: (value: string) => void, options: { value: string; label: string }[], placeholder = "Choose an option") => (
    <label className="space-y-1 text-sm" key={label}>
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );

  const chipField = (label: string, options: string[], selected: string[], onChange: (next: string[]) => void, emptyHint?: string) => (
    <div className="space-y-1.5 text-sm" key={label}>
      <span className="font-medium">{label}</span>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint ?? "No options available yet."}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-airbnb-coral bg-airbnb-coral text-white"
                    : "border-border bg-card text-foreground hover:border-airbnb-coral"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const textArea = (key: "summary" | "about" | "description", label: string, rows = 3) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm"
        rows={rows}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );

  const legacyLocationPickers = (
    <div className="grid gap-3 sm:grid-cols-3">
      {selectField("Country", location.country, (value) => setLocation((current) => ({ ...current, country: value })),
        EAST_AFRICAN_COUNTRIES.map((item) => ({ value: item.name, label: item.name })))}
      <label className="space-y-1 text-sm"><span className="font-medium">City / Town</span>
        <Input value={location.city} onChange={(event) => setLocation((current) => ({ ...current, city: event.target.value }))} /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Neighbourhood</span>
        <Input value={location.neighborhood} onChange={(event) => setLocation((current) => ({ ...current, neighborhood: event.target.value }))} /></label>
    </div>
  );

  const mediaGrid = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {media.map((row, index) => {
        const mediaSource = { ...row, url: typeof row.url === "string" ? row.url : "" };
        const rowKind = row.kind === "video" ? "video" : "photo";
        const url = rowKind === "video"
          ? getMediaVideoUrl(mediaSource)
          : getMediaImageUrl(mediaSource, "detail");
        const isProcessing = row.processing_status != null && row.processing_status !== "ready";
        return (
          <div key={String(row.id ?? index)} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black">
            {rowKind === "video" ? (
              <video src={url} poster={getMediaThumbnailUrl(mediaSource) ?? undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Profile video ${index + 1}`} />
            ) : (
              <Image src={url} alt={`Profile photo ${index + 1}`} fill unoptimized className="object-cover" />
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold capitalize text-white">{rowKind}</span>
            {isProcessing && <span className="absolute bottom-2 left-2 rounded-full bg-amber-500/90 px-2 py-1 text-[10px] font-semibold text-black">Processing</span>}
          </div>
        );
      })}
    </div>
  );

  const mediaUploader = (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center transition hover:border-airbnb-coral">
        <UploadCloud className="mb-2 h-6 w-6 text-airbnb-coral" />
        <span className="text-sm font-semibold">Choose photos and videos</span>
        <span className="mt-1 text-xs text-muted-foreground">
          Files upload immediately and are processed by the media pipeline ({photoCount}/{MEDIA_POLICY.photo.maxCount} photos · {videoCount}/{MEDIA_POLICY.video.maxCount} videos).
        </span>
        <input
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          multiple
          className="sr-only"
          onChange={async (event) => {
            const input = event.currentTarget;
            const selected = Array.from(input.files ?? []);
            input.value = "";
            if (selected.length > 0) await uploadFiles(selected);
          }}
        />
      </label>
      {uploads.length > 0 && (
        <ul className="space-y-1.5">
          {uploads.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
              {item.state === "uploading" && <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-airbnb-coral" />}
              {item.state === "done" && <span className="text-emerald-600">✓</span>}
              {item.state === "error" && <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
              {item.state === "error" && <span className="text-destructive">{item.error}</span>}
              {item.state !== "uploading" && (
                <button type="button" aria-label={`Dismiss ${item.name}`} className="text-muted-foreground hover:text-foreground" onClick={() => setUploads((current) => current.filter((candidate) => candidate.id !== item.id))}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {media.length > 0 && mediaGrid}
    </div>
  );

  const editableFields = (
    <div className="space-y-5">
      {!target && (
        <div className="space-y-3">
          <h3 className="font-semibold">Login account</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm"><span className="font-medium">Full name</span>
              <Input required value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Email address</span>
              <Input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Phone number</span>
              <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
          </div>
        </div>
      )}
      {target && profile && (
        <div className="space-y-3">
          <h3 className="font-semibold">Account profile</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm"><span className="font-medium">Full name</span>
              <Input value={form.name || profile.name} onChange={(event) => update("name", event.target.value)} /></label>
            <p className="text-sm"><span className="font-medium">Email</span><br />{profile.email ?? "—"}</p>
            <label className="space-y-1 text-sm"><span className="font-medium">Phone</span>
              <Input value={form.phone || profile.phone || ""} onChange={(event) => update("phone", event.target.value)} /></label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold">Listing profile</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm"><span className="font-medium">Title</span>
            <Input required value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
          {selectField("Gender", form.gender, (value) => update("gender", value), GENDERS.map((value) => ({ value, label: value })))}
          {isEscort && (
            <label className="space-y-1 text-sm"><span className="font-medium">Age</span>
              <Input type="number" min={18} max={100} value={form.age} onChange={(event) => update("age", event.target.value)} /></label>
          )}
          {selectField("Nationality", form.nationality, (value) => update("nationality", value), nationalities.map((value) => ({ value, label: value })))}
          {isEscort && selectField("Orientation (optional)", form.orientation, (value) => update("orientation", value), orientations.map((value) => ({ value, label: value })), "Prefer not to say")}
          <label className="space-y-1 text-sm"><span className="font-medium">Ethnicity (optional)</span>
            <Input value={form.ethnicity} onChange={(event) => update("ethnicity", event.target.value)} /></label>
          {!isEscort && selectField("Service category", form.serviceType, (value) => {
            update("serviceType", value);
            setServices([]);
          }, SERVICE_TYPES)}
          {!isEscort && (
            <label className="space-y-1 text-sm"><span className="font-medium">Hourly rate (UGX)</span>
              <Input type="number" min={0} value={form.hourlyRate} onChange={(event) => update("hourlyRate", event.target.value)} /></label>
          )}
          {!isEscort && (
            <label className="space-y-1 text-sm"><span className="font-medium">Monthly price (UGX)</span>
              <Input type="number" min={0} value={form.monthlyPrice} onChange={(event) => update("monthlyPrice", event.target.value)} /></label>
          )}
          <label className="space-y-1 text-sm"><span className="font-medium">WhatsApp country code</span>
            <Input value={form.whatsappCode} onChange={(event) => update("whatsappCode", event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="font-medium">WhatsApp number</span>
            <Input value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="font-medium">Telegram</span>
            <Input value={form.telegram} onChange={(event) => update("telegram", event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="font-medium">Travel distance (km)</span>
            <Input value={form.travelKm} onChange={(event) => update("travelKm", event.target.value)} /></label>
          {isEscort && (
            <label className="space-y-1 text-sm"><span className="font-medium">Years of experience</span>
              <Input type="number" min={0} max={60} value={form.yearsExperience} onChange={(event) => update("yearsExperience", event.target.value)} /></label>
          )}
          {isEscort && (
            <label className="flex items-center gap-2 pt-6 text-sm font-medium">
              <input type="checkbox" checked={form.certified} onChange={(event) => update("certified", event.target.checked)} className="h-4 w-4 rounded border-input" />
              Has certificate
            </label>
          )}
        </div>

        {chipField(isEscort ? "Experiences offered" : "Service options",
          isEscort ? modelServiceOptions : (SERVICE_OPTIONS[form.serviceType] ?? []),
          services, setServices,
          isEscort && modelServiceOptions.length === 0
            ? "No active escort service options - add them in Admin → Services first."
            : undefined)}
        {chipField("Languages", LANGUAGES, languageList, setLanguageList)}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Location</h3>
        <LocationCascader
          initialCode={location.locationCode || null}
          initialCountryCode={countryCodeForName(location.country)}
          fallback={legacyLocationPickers}
          onChange={(pick) => {
            if (!pick.country) return;
            const legacy = EAST_AFRICAN_COUNTRIES.find((item) => item.name === pick.country?.name);
            if (legacy) update("whatsappCode", legacy.callingCode);
            const deepest = pick.trail[pick.trail.length - 1] ?? null;
            if (pick.trail.length <= 1) {
              setLocation((current) => ({ ...current, country: pick.country!.name, locationCode: "" }));
              return;
            }
            setLocation((current) => ({
              country: pick.country!.name,
              city: pick.city?.name ?? current.city,
              // Selecting down to city level means the neighbourhood was dropped.
              neighborhood: pick.neighborhood?.name ?? (deepest === pick.city ? "" : current.neighborhood),
              locationCode: deepest?.code ?? "",
            }));
          }}
        />
        <p className="text-xs text-muted-foreground">
          Current value: {[location.country, location.city, location.neighborhood].filter(Boolean).join(" / ") || "not set"}
          {location.locationCode ? ` · gazetteer ${location.locationCode}` : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {textArea("summary", "Short summary", 2)}
        {textArea("about", "About this profile")}
        {textArea("description", "Description (at least 20 characters)", 5)}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Portfolio photos and videos</h3>
        {targetId ? mediaUploader : (
          <p className="text-xs text-muted-foreground">
            Create the listing first - uploads start as soon as the profile exists and are processed by the media pipeline automatically.
          </p>
        )}
      </div>
    </div>
  );

  const listingValues = details
    ? Object.entries(details).filter(([key]) =>
        !["images", "services_offered", "languages", "availability", "profile_details", "cover_image"].includes(key) &&
        (kind !== "escort" || !["hourly_rate", "monthly_price"].includes(key))
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target ? `${editing ? "Edit" : "View"} ${target.title}` : `Add ${isEscort ? "model" : "service provider"}`}</DialogTitle>
          <DialogDescription>
            {target
              ? "Full listing and account profile details, including supporting records."
              : "An invitation will be emailed so the provider can set their password."}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        {notice && !error && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading profile details…</p> : editing ? editableFields : (
          <div className="space-y-5">
            {profile && <section className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Account</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted-foreground">Name</dt><dd>{profile.name}</dd></div>
                <div><dt className="text-muted-foreground">Email</dt><dd>{profile.email ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Phone</dt><dd>{profile.phone ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Account kind</dt><dd>{profile.account_kind}</dd></div>
                <div><dt className="text-muted-foreground">Role</dt><dd>{profile.role}</dd></div>
                <div><dt className="text-muted-foreground">Account ID</dt><dd className="break-all">{profile.id}</dd></div>
              </dl>
            </section>}
            <section className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Complete listing record</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {listingValues.map(([key, value]) => <div key={key} className="min-w-0">
                  <dt className="capitalize text-muted-foreground">{fieldLabel(key)}</dt>
                  <dd className="break-words">{value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                </div>)}
                {(["images", "services_offered", "languages", "availability", "profile_details"] as const).map((key) => <div key={key} className="min-w-0">
                  <dt className="capitalize text-muted-foreground">{fieldLabel(key)}</dt>
                  <dd className="break-words">{JSON.stringify(details?.[key] ?? [])}</dd>
                </div>)}
              </dl>
            </section>
            <section className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Profile photos and videos</h3>
              {!media.length ? <p className="text-sm text-muted-foreground">No portfolio media submitted.</p> : mediaGrid}
            </section>
            {[
              ["Service offerings", isEscort
                ? offerings.map((offering) => Object.fromEntries(
                    Object.entries(offering).filter(([key]) => key !== "price" && key !== "pricing_model")
                  ))
                : offerings],
              ["References", references],
            ].map(([title, records]) => <section key={title as string} className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">{title as string}</h3>
              {!(records as RelatedRows).length ? <p className="text-sm text-muted-foreground">No records.</p> : <div className="space-y-2">
                {(records as RelatedRows).map((row, index) => <pre key={String(row.id ?? index)} className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs">{JSON.stringify(row, null, 2)}</pre>)}
              </div>}
            </section>)}
          </div>
        )}
        <DialogFooter>
          {target && !editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>}
          {editing && <Button disabled={saving || loading} onClick={() => void save()}>{saving ? "Saving…" : target ? "Save changes" : "Create account & listing"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
