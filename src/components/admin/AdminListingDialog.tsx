"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

type ListingForm = {
  name: string;
  email: string;
  phone: string;
  title: string;
  city: string;
  neighborhood: string;
  hourlyRate: string;
  monthlyPrice: string;
  age: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  serviceType: string;
  whatsappCode: string;
  whatsappNumber: string;
  telegram: string;
  summary: string;
  description: string;
  about: string;
  services: string;
  languages: string;
  images: string;
};

const blankForm = (kind: "escort" | "service"): ListingForm => ({
  name: "",
  email: "",
  phone: "",
  title: "",
  city: "Kampala",
  neighborhood: "",
  hourlyRate: "50000",
  monthlyPrice: "150000",
  age: "",
  gender: "",
  nationality: "Ugandan",
  ethnicity: "",
  serviceType: kind === "service" ? "other" : "",
  whatsappCode: "+256",
  whatsappNumber: "",
  telegram: "",
  summary: "",
  description: "",
  about: "",
  services: "",
  languages: "English, Luganda",
  images: "",
});

function listText(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").join(", ") : "";
}

function lines(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
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
  const [details, setDetails] = useState<ListingDetails | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<RelatedRows>([]);
  const [offerings, setOfferings] = useState<RelatedRows>([]);
  const [references, setReferences] = useState<RelatedRows>([]);
  const [form, setForm] = useState<ListingForm>(() => blankForm(createKind ?? "escort"));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const kind = listing ? listing.kind as "escort" | "service" : createKind ?? "escort";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError("");
    setEditing(!listing);
    setDetails(null);
    setProfile(null);
    setForm(blankForm(kind));
    if (!listing || !supabase) {
      if (listing && !supabase) setError("Configure Supabase to view profile details.");
      return;
    }
    const client = supabase;

    const loadDetails = async () => {
      setLoading(true);
      const [listingResult, mediaResult, offeringsResult, referencesResult] = await Promise.all([
        client.from("listings").select("*").eq("id", listing.id).single(),
        client.from("profile_media").select("*").eq("listing_id", listing.id).order("sort_order"),
        client.from("profile_offerings").select("*").eq("listing_id", listing.id).order("sort_order"),
        client.from("profile_references").select("*").eq("listing_id", listing.id).order("created_at"),
      ]);
      if (cancelled) return;
      const failure = listingResult.error ?? mediaResult.error ?? offeringsResult.error ?? referencesResult.error;
      if (failure) {
        setError(failure.message);
        setLoading(false);
        return;
      }
      const listingData = listingResult.data as unknown as ListingDetails;
      setDetails(listingData);
      setMedia((mediaResult.data ?? []) as RelatedRows);
      setOfferings((offeringsResult.data ?? []) as RelatedRows);
      setReferences((referencesResult.data ?? []) as RelatedRows);
      let loadedProfile: Profile | null = null;
      if (listing.user_id) {
        const { data, error: profileError } = await client
          .from("profiles")
          .select("id,name,email,phone,account_kind,role")
          .eq("id", listing.user_id)
          .maybeSingle();
        if (cancelled) return;
        if (profileError) setError(profileError.message);
        loadedProfile = data as Profile | null;
        setProfile(loadedProfile);
      }
      setForm({
        ...blankForm(kind),
        title: listingData.title ?? "",
        name: loadedProfile?.name ?? "",
        phone: loadedProfile?.phone ?? "",
        city: listingData.city ?? "",
        neighborhood: listingData.neighborhood ?? "",
        hourlyRate: String(listingData.hourly_rate ?? ""),
        monthlyPrice: String(listingData.monthly_price ?? ""),
        age: listingData.age == null ? "" : String(listingData.age),
        gender: String(listingData.gender ?? ""),
        nationality: String(listingData.nationality ?? ""),
        ethnicity: String(listingData.ethnicity ?? ""),
        serviceType: String(listingData.service_type ?? ""),
        whatsappCode: String(listingData.whatsapp_code ?? "+256"),
        whatsappNumber: String(listingData.whatsapp_number ?? ""),
        telegram: String(listingData.telegram ?? ""),
        summary: String(listingData.summary_line ?? ""),
        description: String(listingData.description ?? ""),
        about: String(listingData.about_me ?? ""),
        services: listText(listingData.services_offered),
        languages: listText(listingData.languages),
        images: listText(listingData.images),
      });
      setLoading(false);
    };
    void loadDetails();
    return () => { cancelled = true; };
  }, [open, listing, kind]);

  const update = (key: keyof ListingForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const numeric = (value: string, label: string, minimum: number) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error(`${label} must be a whole number of at least ${minimum}.`);
    return parsed;
  };

  const save = async () => {
    if (!supabase) return setError("Configure Supabase to save profile details.");
    setError("");
    if (!form.title.trim() || !form.city.trim() || !form.neighborhood.trim() || form.description.trim().length < 20) {
      setError("Enter a title, city, neighborhood, and a description of at least 20 characters.");
      return;
    }
    if (!listing && (!form.name.trim() || !form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) {
      setError("Enter the account holder's name and a valid email address for the invitation.");
      return;
    }
    if (kind === "escort" && (!form.age || Number(form.age) < 18 || Number(form.age) > 100)) {
      setError("Model profiles must be for adults aged 18 or older.");
      return;
    }
    setSaving(true);
    try {
      const listingPayload = {
        title: form.title.trim(),
        slug: listing ? String(details?.slug ?? "") : `${form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`,
        kind,
        escort_tier: kind === "escort" ? "premium" : "standard",
        category: kind === "escort" ? (form.gender.trim().toLowerCase() || "female") : "service",
        service_type: kind === "service" ? (form.serviceType.trim() || "other") : null,
        age: kind === "escort" ? Number(form.age) : null,
        gender: form.gender.trim() || null,
        nationality: form.nationality.trim() || null,
        ethnicity: form.ethnicity.trim() || null,
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        hourly_rate: numeric(form.hourlyRate, "Hourly rate", 0),
        monthly_price: numeric(form.monthlyPrice || "0", "Monthly price", 0),
        whatsapp_code: form.whatsappCode.trim() || "+256",
        whatsapp_number: form.whatsappNumber.replace(/\D/g, "") || null,
        telegram: form.telegram.trim() || null,
        summary_line: form.summary.trim() || null,
        description: form.description.trim(),
        about_me: form.about.trim() || null,
        services_offered: lines(form.services),
        languages: lines(form.languages),
        cover_image: lines(form.images)[0] ?? null,
        images: lines(form.images),
        verification_status: "pending",
      };
      if (listing) {
        const { error: updateError } = await supabase.from("listings").update(listingPayload).eq("id", listing.id);
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
            accountKind: kind === "escort" ? "model" : "specialist",
            listing: listingPayload,
          }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "The account and listing could not be created.");
      }
      onSaved();
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const editable = (key: keyof ListingForm, label: string, type = "text", required = false) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <Input type={type} required={required} value={form[key]} onChange={(event) => update(key, event.target.value)} />
    </label>
  );
  const textArea = (key: keyof ListingForm, label: string, rows = 3) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <textarea className="min-h-24 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm" rows={rows} value={form[key]} onChange={(event) => update(key, event.target.value)} />
    </label>
  );

  const accountFields: (keyof ListingForm)[] = ["name", "email", "phone"];
  const editableFields: (keyof ListingForm)[] = ["title", "city", "neighborhood", "hourlyRate", "monthlyPrice", "age", "gender", "nationality", "ethnicity", "serviceType", "whatsappCode", "whatsappNumber", "telegram"];
  const listingValues = details ? Object.entries(details).filter(([key]) => !["images", "services_offered", "languages", "availability", "profile_details"].includes(key)) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? `${editing ? "Edit" : "View"} ${listing.title}` : `Add ${kind === "escort" ? "model" : "service provider"}`}</DialogTitle>
          <DialogDescription>
            {listing ? "Full listing and account profile details, including supporting records." : "An invitation will be emailed so the provider can set their password."}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading profile details…</p> : editing ? (
          <div className="space-y-5">
            {!listing && <div className="space-y-3">
              <h3 className="font-semibold">Login account</h3>
              <div className="grid gap-3 sm:grid-cols-3">{accountFields.map((key) => editable(key, key === "name" ? "Full name" : key === "email" ? "Email address" : "Phone number", key === "email" ? "email" : "text", key !== "phone"))}</div>
            </div>}
            {listing && profile && <div className="space-y-3">
              <h3 className="font-semibold">Account profile</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm"><span className="font-medium">Full name</span><Input value={form.name || profile.name} onChange={(event) => update("name", event.target.value)} /></label>
                <p className="text-sm"><span className="font-medium">Email</span><br />{profile.email ?? "—"}</p>
                <label className="space-y-1 text-sm"><span className="font-medium">Phone</span><Input value={form.phone || profile.phone || ""} onChange={(event) => update("phone", event.target.value)} /></label>
              </div>
            </div>}
            <div className="space-y-3">
              <h3 className="font-semibold">Listing profile</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {editableFields.map((key) => editable(key, ({
                  hourlyRate: "Hourly rate (UGX)", monthlyPrice: "Monthly price (UGX)", whatsappCode: "WhatsApp country code",
                  whatsappNumber: "WhatsApp number", serviceType: "Service type",
                } as Partial<Record<keyof ListingForm, string>>)[key] ?? fieldLabel(key), key === "hourlyRate" || key === "monthlyPrice" || key === "age" ? "number" : "text", ["title", "city", "neighborhood"].includes(key)))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {textArea("summary", "Short summary", 2)}
                {textArea("about", "About this profile")}
                {textArea("description", "Description (at least 20 characters)", 5)}
                {textArea("services", "Services offered (comma or newline separated)")}
                {textArea("languages", "Languages (comma or newline separated)")}
                {textArea("images", "Image URLs (comma or newline separated)")}
              </div>
            </div>
          </div>
        ) : (
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
              {!media.length ? <p className="text-sm text-muted-foreground">No portfolio media submitted.</p> : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {media.map((row, index) => {
                    const url = typeof row.url === "string" ? row.url : "";
                    const kind = row.kind === "video" ? "video" : "photo";
                    return (
                      <div key={String(row.id ?? index)} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black">
                        {kind === "video" ? (
                          <video src={url} poster={typeof row.thumbnail_url === "string" ? row.thumbnail_url : undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Profile video ${index + 1}`} />
                        ) : (
                          <Image src={url} alt={`Profile photo ${index + 1}`} fill unoptimized className="object-cover" />
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold capitalize text-white">{kind}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            {[
              ["Service offerings", offerings],
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
          {listing && !editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>}
          {editing && <Button disabled={saving || loading} onClick={() => void save()}>{saving ? "Saving…" : listing ? "Save changes" : "Create account & listing"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
