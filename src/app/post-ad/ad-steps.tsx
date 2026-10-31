"use client";

import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  Link2,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EAST_AFRICAN_COUNTRIES } from "@/lib/data/uganda-locations";
import {
  AD_CATEGORIES,
  AD_MEDIA_HINT,
  AD_TYPES,
  type AdTypeOption,
} from "./ad-config";
import {
  Field,
  InlineAlert,
  ReviewRow,
  SelectInput,
} from "@/app/provider/onboarding/onboarding-ui";
import { PortfolioUploader } from "@/app/provider/onboarding/portfolio-uploader";
import type { AdController } from "./use-ad";

/**
 * The Post Ad wizard steps as standalone renderers, mirroring the provider
 * onboarding module. They read only from the controller returned by `useAd`,
 * which owns all state and the signed-upload queue, so each step stays pure.
 */

const AD_TYPE_ICONS: Record<string, typeof Zap> = {
  fast: Zap,
  independent: UserRound,
  agency: Building2,
};

/**
 * The Fast / Independent / Agency gateway chooser. It lives in the Post Ad flow
 * (not provider onboarding) because the ad type is an attribute of the ad, not
 * of a profile. Picking a card defaults the placement window and navigates.
 */
export function AdTypeChooser({
  selected,
  onPick,
}: {
  selected: AdTypeOption | null;
  onPick: (option: AdTypeOption) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="text-center">
        <Badge variant="secondary">Choose a placement</Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          What kind of ad do you want to post?
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Fast ads are short and high-visibility. Independent and Agency ads run longer and can
          carry links and a richer description. Each defaults a placement window you can review
          before submitting.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {AD_TYPES.map((option) => {
          const Icon = AD_TYPE_ICONS[option.id] ?? Zap;
          const isSelected = selected?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPick(option)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all ${
                isSelected
                  ? "border-airbnb-coral bg-rose-50 dark:bg-rose-950/30"
                  : "border-border bg-card hover:border-airbnb-coral/60 hover:shadow-md"
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-airbnb-coral/10 text-airbnb-coral">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {option.blurb}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-airbnb-coral">
                  ~{option.defaultDays} day{option.defaultDays > 1 ? "s" : ""} default window
                </span>
              </span>
              {isSelected && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-airbnb-coral" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your ad is saved as a draft and stays private until a moderator publishes it.
      </p>
    </div>
  );
}

export function StepContent({ c }: { c: AdController }) {
  const { form, update, addLink, setLink, removeLink } = c;
  return (
    <div className="space-y-5">
      <Field label="Ad title" hint="What you are promoting. This is the headline readers see.">
        <Input
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="e.g. Weekend catering special in Kololo"
          maxLength={120}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category">
          <SelectInput
            value={form.category}
            onChange={(value) => update("category", value as typeof form.category)}
          >
            {AD_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="One-line summary (optional)" hint="A short hook shown under the title.">
          <Input
            value={form.summaryLine}
            onChange={(event) => update("summaryLine", event.target.value)}
            placeholder="e.g. Book this weekend, save 20%"
            maxLength={140}
          />
        </Field>
      </div>
      <Field label="Description" hint="At least 10 characters. Do not include private identity details.">
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={5}
          maxLength={2500}
          placeholder="Describe the offer, what makes it stand out, and what people should expect..."
          className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/2500</div>
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Links (optional)</p>
          <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={addLink}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add link
          </Button>
        </div>
        {form.links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add a website, menu or booking link. Every link must start with http:// or https://.
          </p>
        ) : (
          <div className="space-y-2">
            {form.links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link.label}
                  onChange={(event) => setLink(index, { label: event.target.value })}
                  placeholder="Label (e.g. Website)"
                  className="w-40"
                />
                <Input
                  value={link.url}
                  onChange={(event) => setLink(index, { url: event.target.value })}
                  placeholder="https://..."
                  inputMode="url"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                  onClick={() => removeLink(index)}
                  aria-label={`Remove link ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepMedia({ c }: { c: AdController }) {
  return (
    <Field label="Ad photos and video" hint={AD_MEDIA_HINT}>
      <PortfolioUploader
        queue={c.queue}
        existingMedia={c.existingMedia}
        onRemoveExisting={c.removeExistingMedia}
        disabled={c.saving}
      />
    </Field>
  );
}

export function StepLocationContact({ c }: { c: AdController }) {
  const { form, update, cities, availableAreas } = c;
  const showNeighborhoodInput =
    form.neighborhood === "Other" || (form.neighborhood && !availableAreas.includes(form.neighborhood));
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Country">
          <SelectInput
            value={form.country}
            onChange={(value) => {
              const country = EAST_AFRICAN_COUNTRIES.find((item) => item.name === value);
              update("country", value);
              update("city", country?.cities[0] ?? "");
              update("neighborhood", "");
              update("whatsappCode", country?.callingCode ?? "+256");
            }}
          >
            {EAST_AFRICAN_COUNTRIES.map((country) => (
              <option key={country.name}>{country.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="City / district">
          <SelectInput
            value={form.city}
            onChange={(value) => {
              update("city", value);
              update("neighborhood", "");
            }}
          >
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Neighbourhood (optional)">
          <SelectInput
            value={availableAreas.includes(form.neighborhood) ? form.neighborhood : form.neighborhood ? "Other" : ""}
            onChange={(value) => update("neighborhood", value)}
          >
            <option value="">Choose neighbourhood</option>
            {availableAreas.map((area) => (
              <option key={area}>{area}</option>
            ))}
            <option value="Other">Other</option>
          </SelectInput>
          {showNeighborhoodInput && (
            <Input
              className="mt-2"
              value={form.neighborhood === "Other" ? "" : form.neighborhood}
              placeholder="Enter the neighbourhood"
              onChange={(event) => update("neighborhood", event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp number" hint="Shown on the ad so clients can reach you.">
          <div className="flex gap-2">
            <SelectInput value={form.whatsappCode} onChange={(value) => update("whatsappCode", value)} className="w-28">
              {EAST_AFRICAN_COUNTRIES.map((country) => (
                <option key={country.callingCode}>{country.callingCode}</option>
              ))}
            </SelectInput>
            <Input
              value={form.whatsappNumber}
              onChange={(event) => update("whatsappNumber", event.target.value)}
              placeholder="700 000 000"
              inputMode="tel"
            />
          </div>
        </Field>
        <Field label="Telegram username (optional)">
          <Input
            value={form.telegram}
            onChange={(event) => update("telegram", event.target.value)}
            placeholder="@username"
          />
        </Field>
      </div>
    </div>
  );
}

export function StepReview({ c }: { c: AdController }) {
  const { form, option, priceSnapshot, update } = c;
  const preparingCount =
    c.existingMedia.filter(
      (item) => item.storageProvider === "cloudinary" && item.processingStatus !== "ready"
    ).length + c.queue.items.filter((item) => item.status === "processing").length;
  type Preview = { key: string; kind: "photo" | "video"; previewUrl: string };
  const previews: Preview[] = [
    ...c.existingMedia.map((item): Preview => ({
      key: item.id ?? item.url,
      kind: item.kind,
      previewUrl: item.cardUrl ?? item.url,
    })),
    ...c.queue.items
      .filter((item) => item.status === "processing")
      .map((item): Preview => ({
        key: item.id,
        kind: item.kind,
        previewUrl: c.queue.previewFor(item.id) ?? "",
      })),
  ].slice(0, 5);
  const price = `${priceSnapshot.amount.toLocaleString()} ${priceSnapshot.currency}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold">Your ad goes to a moderator before it is published</p>
          <p className="mt-1 text-xs">
            Submitting moves it to “pending”. Only an admin can publish it into an ad space, so it
            never appears publicly on its own.
          </p>
        </div>
      </div>

      <ReviewRow
        icon={option.id === "agency" ? <Building2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        label="Ad type"
        value={`${option.label} · runs ${Math.max(1, form.durationDays)} day${form.durationDays > 1 ? "s" : ""}`}
      />
      <ReviewRow
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Ad"
        value={`${form.title}${form.summaryLine ? ` — ${form.summaryLine}` : ""}`}
      />
      <ReviewRow
        icon={<MapPin className="h-4 w-4" />}
        label="Location & contact"
        value={`${[form.neighborhood, form.city, form.country].filter(Boolean).join(", ")} · ${
          form.whatsappNumber
            ? `WhatsApp ${form.whatsappCode} ${form.whatsappNumber}`
            : ""
        }${form.whatsappNumber && form.telegram ? " · " : ""}${form.telegram ? `Telegram ${form.telegram}` : ""}`}
      />
      {form.links.some((link) => link.url) && (
        <ReviewRow
          icon={<Link2 className="h-4 w-4" />}
          label="Links"
          value={form.links.filter((link) => link.url).map((link) => link.label || link.url).join(", ")}
        />
      )}

      <Field label="How long should the ad run?" hint="Changing this updates the end date on submit.">
        <Input
          type="number"
          min={1}
          max={365}
          value={String(form.durationDays)}
          onChange={(event) => update("durationDays", Math.max(1, Math.min(365, Number(event.target.value) || 1)))}
        />
      </Field>

      <div className="flex items-center justify-between rounded-2xl border border-border p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price snapshot</p>
          <p className="mt-1 text-sm font-medium">
            {price} · settle via mobile payment once an admin publishes your ad.
          </p>
        </div>
        <Badge variant="secondary">{option.tier}</Badge>
      </div>

      <div className="rounded-2xl border border-border p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
        <p className="text-sm leading-relaxed">{form.description || "Add a description before submitting."}</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((item, index) => (
            <div key={item.key} className="relative aspect-square overflow-hidden rounded-xl bg-black">
              {item.kind === "video" ? (
                <video
                  src={item.previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  aria-label={`Ad media ${index + 1}`}
                />
              ) : (
                <Image
                  src={item.previewUrl}
                  alt={`Ad photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {preparingCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <span>
            Preparing your {preparingCount > 1 ? "media" : "photo or video"}… Cloudinary is finishing
            optimisation. It updates on its own, and you can still submit now.
          </span>
        </div>
      )}
      {c.queue.hasActiveUploads && (
        <Badge variant="secondary" className="text-xs">
          Some media is still uploading. You can submit once it finishes.
        </Badge>
      )}
      {c.error && <InlineAlert>{c.error}</InlineAlert>}
    </div>
  );
}
