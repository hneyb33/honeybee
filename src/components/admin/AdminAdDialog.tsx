"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMediaImageUrl,
  getMediaThumbnailUrl,
  getMediaVideoUrl,
} from "@/lib/media-urls";
import { supabase } from "@/lib/supabase/client";

type AdSummary = {
  id: string;
  title: string;
  ad_type: string;
  status: string;
};

type AdDetails = Record<string, unknown> & {
  id: string;
  title: string;
  ad_type: string;
  slug: string;
  category: string | null;
  summary_line: string | null;
  description: string;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  contact_whatsapp_code: string | null;
  contact_whatsapp_number: string | null;
  contact_telegram: string | null;
  links: { label?: string; url?: string }[];
  cover_image: string | null;
  status: string;
  moderation_notes: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type AdMediaRow = {
  id: string;
  url: string;
  kind: "photo" | "video";
  sort_order: number;
  thumbnail_url?: string | null;
  card_url?: string | null;
  detail_url?: string | null;
  playback_url?: string | null;
  storage_provider?: string | null;
  processing_status?: string | null;
};

type AdForm = {
  adType: string;
  category: string;
  title: string;
  summaryLine: string;
  description: string;
  city: string;
  neighborhood: string;
  country: string;
  whatsappCode: string;
  whatsappNumber: string;
  telegram: string;
  links: string;
  status: string;
  photoUrls: string;
  videoUrls: string;
};

const AD_TYPES = ["fast", "independent", "agency"];
const AD_CATEGORIES = ["announcement", "event", "business", "service", "companion"];
const AD_STATUSES = ["draft", "pending", "published", "rejected", "expired"];

const blankAdForm = (): AdForm => ({
  adType: "independent",
  category: "service",
  title: "",
  summaryLine: "",
  description: "",
  city: "Kampala",
  neighborhood: "",
  country: "Uganda",
  whatsappCode: "+256",
  whatsappNumber: "",
  telegram: "",
  links: "",
  status: "pending",
  photoUrls: "",
  videoUrls: "",
});

function lines(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

// One link per line: "Label :: https://url" or just "https://url".
function parseLinks(value: string) {
  return lines(value)
    .map((raw) => {
      const [labelPart, urlPart] = raw.includes("::") ? raw.split("::") : ["", raw];
      const url = (urlPart ?? raw).trim();
      if (!url) return null;
      return { label: (labelPart ?? "").trim() || url, url };
    })
    .filter((link): link is { label: string; url: string } => Boolean(link && /^https?:\/\//i.test(link.url)));
}

function linksToText(links: { label?: string; url?: string }[]) {
  return (links ?? [])
    .map((link) => (link.url ? `${link.label && link.label !== link.url ? `${link.label} :: ` : ""}${link.url}` : ""))
    .filter(Boolean)
    .join("\n");
}

export function AdminAdDialog({
  open,
  ad,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  ad: AdSummary | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [details, setDetails] = useState<AdDetails | null>(null);
  const [media, setMedia] = useState<AdMediaRow[]>([]);
  const [form, setForm] = useState<AdForm>(() => blankAdForm());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError("");
    setEditing(!ad);
    setDetails(null);
    setMedia([]);
    setForm(blankAdForm());
    if (!ad || !supabase) {
      if (ad && !supabase) setError("Configure Supabase to view ad details.");
      return;
    }
    const client = supabase;

    const loadDetails = async () => {
      setLoading(true);
      const [adResult, mediaResult] = await Promise.all([
        client.from("ads").select("*").eq("id", ad.id).single(),
        client.from("ad_media").select("*").eq("ad_id", ad.id).order("sort_order"),
      ]);
      if (cancelled) return;
      const failure = adResult.error ?? mediaResult.error;
      if (failure) {
        setError(failure.message);
        setLoading(false);
        return;
      }
      const data = adResult.data as unknown as AdDetails;
      setDetails(data);
      setMedia((mediaResult.data ?? []) as AdMediaRow[]);
      setForm({
        ...blankAdForm(),
        adType: data.ad_type ?? "independent",
        category: data.category ?? "service",
        title: data.title ?? "",
        summaryLine: data.summary_line ?? "",
        description: data.description ?? "",
        city: data.city ?? "",
        neighborhood: data.neighborhood ?? "",
        country: data.country ?? "Uganda",
        whatsappCode: data.contact_whatsapp_code ?? "+256",
        whatsappNumber: data.contact_whatsapp_number ?? "",
        telegram: data.contact_telegram ?? "",
        links: linksToText(data.links ?? []),
        status: data.status ?? "pending",
      });
      setLoading(false);
    };
    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [open, ad]);

  const update = (key: keyof AdForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const addManualMedia = async (url: string, kind: "photo" | "video") => {
    if (!supabase || !ad) return;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Enter a valid http(s) media URL.");
      return;
    }
    setError("");
    const sortOrder = media.filter((item) => item.kind === kind).length;
    const { error: insertError } = await supabase.from("ad_media").insert({
      ad_id: ad.id,
      url: trimmed,
      kind,
      sort_order: sortOrder,
      storage_provider: "supabase",
      processing_status: "ready",
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const { data } = await supabase.from("ad_media").select("*").eq("ad_id", ad.id).order("sort_order");
    setMedia((data ?? []) as AdMediaRow[]);
    if (kind === "photo") {
      const firstPhoto = (data ?? []).find((item: AdMediaRow) => item.kind === "photo");
      if (firstPhoto) {
        await supabase.rpc("admin_update_ad", { p_ad_id: ad.id, p_data: { cover_image: firstPhoto.url } });
      }
    }
  };

  const removeMedia = async (row: AdMediaRow) => {
    if (!supabase || !ad) return;
    const { error: deleteError } = await supabase.from("ad_media").delete().eq("id", row.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setMedia((current) => current.filter((item) => item.id !== row.id));
  };

  const save = async () => {
    if (!supabase) return setError("Configure Supabase to save ads.");
    setError("");
    if (!form.title.trim() || form.description.trim().length < 10) {
      setError("Enter a title and a description of at least 10 characters.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ad_type: form.adType,
        category: form.category || null,
        title: form.title.trim(),
        summary_line: form.summaryLine.trim() || null,
        description: form.description.trim(),
        city: form.city.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        country: form.country.trim() || "Uganda",
        contact_whatsapp_code: form.whatsappCode.trim() || "+256",
        contact_whatsapp_number: form.whatsappNumber.trim() || null,
        contact_telegram: form.telegram.trim() || null,
        links: parseLinks(form.links),
        status: form.status,
      };

      if (ad) {
        const { error: rpcError } = await supabase.rpc("admin_update_ad", { p_ad_id: ad.id, p_data: payload });
        if (rpcError) throw rpcError;
      } else {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError || !authData.session?.access_token) throw authError ?? new Error("Your admin session expired. Sign in again.");
        const response = await fetch("/api/admin/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authData.session.access_token}` },
          body: JSON.stringify({
            ...payload,
            is_featured: false,
            featured_tier: null,
            photo_urls: lines(form.photoUrls).filter((url) => /^https?:\/\//i.test(url)),
            video_urls: lines(form.videoUrls).filter((url) => /^https?:\/\//i.test(url)),
          }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "The ad could not be created.");
      }
      onSaved();
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The ad could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const selectField = (key: keyof AdForm, label: string, options: string[]) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <select
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  const inputField = (key: keyof AdForm, label: string) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <Input value={form[key]} onChange={(event) => update(key, event.target.value)} />
    </label>
  );

  const textArea = (key: keyof AdForm, label: string, rows = 3, placeholder?: string) => (
    <label className="space-y-1 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm"
        rows={rows}
        placeholder={placeholder}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ad ? `${editing ? "Edit" : "View"} ${ad.title}` : "Add an ad"}</DialogTitle>
          <DialogDescription>
            {ad ? "An ad is a self-contained placement. Publish, feature and settle it from the advertising list." : "Create a standalone ad. Manual media URLs are seeded into the ad's gallery."}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading ad details…</p>
        ) : editing ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {selectField("adType", "Ad type", AD_TYPES)}
              {selectField("category", "Category", AD_CATEGORIES)}
              {selectField("status", "Status", AD_STATUSES)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {inputField("title", "Title")}
              {inputField("summaryLine", "One-line summary")}
            </div>
            {textArea("description", "Description (at least 10 characters)", 5)}
            <div className="grid gap-3 sm:grid-cols-3">
              {inputField("city", "City")}
              {inputField("neighborhood", "Neighbourhood")}
              {inputField("country", "Country")}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {inputField("whatsappCode", "WhatsApp code")}
              {inputField("whatsappNumber", "WhatsApp number")}
              {inputField("telegram", "Telegram")}
            </div>
            {textArea("links", "Links (one per line, \"Label :: https://url\")", 3, "Instagram :: https://instagram.com/offer\nhttps://booking.example")}
            {!ad && (
              <div className="grid gap-3 sm:grid-cols-2">
                {textArea("photoUrls", "Photo URLs (one per line)", 3, "https://...")}
                {textArea("videoUrls", "Video URLs (one per line)", 3, "https://...")}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Ad record</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Type</dt><dd>{details?.ad_type}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd>{details?.status}</dd></div>
                <div><dt className="text-muted-foreground">Category</dt><dd>{details?.category ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Location</dt><dd>{[details?.neighborhood, details?.city, details?.country].filter(Boolean).join(", ") || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Contact</dt><dd>{details?.contact_whatsapp_number ? `${details?.contact_whatsapp_code ?? ""} ${details?.contact_whatsapp_number}` : details?.contact_telegram ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Runs</dt><dd>{details?.starts_at ? new Date(details.starts_at).toLocaleDateString() : "—"} → {details?.ends_at ? new Date(details.ends_at).toLocaleDateString() : "open"}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{details?.description}</p>
              {details?.moderation_notes && <p className="mt-2 text-xs text-destructive">Moderation: {details.moderation_notes}</p>}
            </section>
            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Ad media</h3>
                <div className="flex items-center gap-2">
                  <Input
                    id="admin-ad-media-url"
                    placeholder="https:// manual media URL"
                    className="h-9 max-w-64 text-xs"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const input = event.currentTarget;
                        const kind = (document.getElementById("admin-ad-media-kind") as HTMLSelectElement | null)?.value === "video" ? "video" : "photo";
                        void addManualMedia(input.value, kind);
                        input.value = "";
                      }
                    }}
                  />
                  <select id="admin-ad-media-kind" className="h-9 rounded-lg border border-input bg-background px-2 text-xs">
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                  <Button size="sm" variant="outline" onClick={() => {
                    const input = document.getElementById("admin-ad-media-url") as HTMLInputElement | null;
                    const kind = (document.getElementById("admin-ad-media-kind") as HTMLSelectElement | null)?.value === "video" ? "video" : "photo";
                    if (input?.value.trim()) { void addManualMedia(input.value, kind); input.value = ""; }
                  }}>
                    <Plus className="mr-1 h-4 w-4" />Add
                  </Button>
                </div>
              </div>
              {!media.length ? <p className="text-sm text-muted-foreground">No media on this ad yet.</p> : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {media.map((row, index) => {
                    const mediaSource = { ...row, url: row.url };
                    const url = row.kind === "video" ? getMediaVideoUrl(mediaSource) : getMediaImageUrl(mediaSource, "detail");
                    return (
                      <div key={row.id ?? index} className="relative aspect-square overflow-hidden rounded-xl bg-black">
                        {row.kind === "video" ? (
                          <video src={url} poster={getMediaThumbnailUrl(mediaSource) ?? undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Ad video ${index + 1}`} />
                        ) : (
                          <Image src={url} alt={`Ad photo ${index + 1}`} fill unoptimized className="object-cover" />
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${row.kind} ${index + 1}`}
                          onClick={() => void removeMedia(row)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
        <DialogFooter>
          {ad && !editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit ad</Button>}
          {editing && <Button disabled={saving || loading} onClick={() => void save()}>{saving ? "Saving…" : ad ? "Save changes" : "Create ad"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
