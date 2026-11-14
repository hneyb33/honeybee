"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Globe2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocationCascader } from "@/components/location/LocationCascader";
import {
  countryCodeForName,
  searchLocations,
  type ServiceCoverageTier,
} from "@/lib/locations";
import { EAST_AFRICAN_COUNTRIES } from "@/lib/data/uganda-locations";
import { isMediaReady } from "@/lib/media-records";
import {
  DAYS,
  LANGUAGES,
  SERVICE_OPTIONS,
  nationalities,
  orientations,
} from "../onboarding/onboarding-config";
import { CheckboxGrid, Field, RadioGroup, SelectInput } from "../onboarding/onboarding-ui";
import { PortfolioUploader } from "../onboarding/portfolio-uploader";
import type { MyAccountController } from "./use-my-account";

/**
 * The five independently-saving sections of the My Account page. Each owns its
 * draft state, seeds it from the loaded listing and reports save results in
 * its own strip, so editing one never disturbs another.
 */

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "verified") return "default";
  if (status === "rejected" || status === "suspended") return "destructive";
  return "secondary";
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-5 rounded-3xl p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-airbnb-coral/10 text-airbnb-coral">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Shared per-section save plumbing: busy flag, result strip, error text. */
function useSectionSave() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const run = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    setResult(null);
    const outcome = await action();
    setResult(
      outcome.ok
        ? { kind: "ok", message: outcome.message ?? "Saved." }
        : { kind: "error", message: outcome.message ?? "Could not save. Try again." }
    );
    setBusy(false);
    return outcome.ok;
  };
  return { busy, result, run };
}

function SaveStrip({
  busy,
  result,
}: {
  busy: boolean;
  result: { kind: "ok" | "error"; message: string } | null;
}) {
  if (!result) return null;
  return (
    <p
      role="status"
      className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
        result.kind === "ok"
          ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
          : "border-destructive/30 bg-destructive/5 text-destructive"
      }`}
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {result.message}
    </p>
  );
}

function SaveButton({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <Button onClick={onClick} disabled={busy} className="rounded-xl bg-airbnb-coral text-white hover:bg-[#AD3039]">
      {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function StatusSection({ c }: { c: MyAccountController }) {
  const listing = c.listing!;
  return (
    <SectionCard
      icon={<ShieldCheck className="h-5 w-5" />}
      title="Profile status"
      description="How your profile currently appears in the directory."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={statusVariant(listing.verification_status)}>
          {STATUS_LABELS[listing.verification_status] ?? listing.verification_status}
        </Badge>
        {listing.escort_tier === "vip" && <Badge variant="vip">VIP visibility</Badge>}
        <Link
          href={`/profiles/${listing.slug}`}
          className="text-xs font-semibold text-airbnb-coral underline underline-offset-2"
        >
          View public profile
        </Link>
      </div>
      {listing.verification_notes && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Reviewer notes: {listing.verification_notes}
        </p>
      )}
      {c.remoderationNotice && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          You edited a verified profile, so it re-entered review. It stays listed until an admin
          finishes the new review.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Saves below keep a draft as a draft; editing a verified or rejected profile sends it back
        to review.
      </p>
    </SectionCard>
  );
}

export function IdentitySection({ c }: { c: MyAccountController }) {
  const listing = c.listing!;
  const details = listing.profile_details ?? {};
  const [name, setName] = useState(c.profile?.name ?? "");
  const [phone, setPhone] = useState(c.profile?.phone ?? "");
  const [title, setTitle] = useState(listing.title ?? "");
  const [age, setAge] = useState(listing.age ? String(listing.age) : "");
  const [gender, setGender] = useState(listing.gender ?? "");
  const [nationality, setNationality] = useState(listing.nationality ?? "Ugandan");
  const [orientation, setOrientation] = useState(String(details.orientation ?? ""));
  const [summaryLine, setSummaryLine] = useState(listing.summary_line ?? "");
  const { busy, result, run } = useSectionSave();
  const isModel = listing.kind === "escort";

  return (
    <SectionCard
      icon={<UserRound className="h-5 w-5" />}
      title="Identity & contact"
      description="Your account name and the public basics clients see first."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account name">
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
        </Field>
        <Field label="Phone" hint="Kept on your account, not published on the profile.">
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="0700 000 000" />
        </Field>
        <Field label="Public display name">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
        </Field>
        {isModel && (
          <Field label="Age" hint="You must be at least 18.">
            <Input type="number" min={18} max={100} value={age} onChange={(event) => setAge(event.target.value)} />
          </Field>
        )}
        <Field label="Gender">
          <RadioGroup
            name="account-gender"
            value={gender}
            onChange={setGender}
            options={["Female", "Male", "Non-binary"]}
          />
        </Field>
        <Field label="Nationality">
          <SelectInput value={nationality} onChange={setNationality}>
            {nationalities.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </SelectInput>
        </Field>
        {isModel && (
          <Field label="Orientation (optional)">
            <SelectInput value={orientation} onChange={setOrientation}>
              <option value="">Choose an option</option>
              {orientations.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </SelectInput>
          </Field>
        )}
        <div className="sm:col-span-2">
          <Field label="One-line summary">
            <Input
              value={summaryLine}
              onChange={(event) => setSummaryLine(event.target.value)}
              maxLength={160}
              placeholder="Short headline shown under your name"
            />
          </Field>
        </div>
      </div>
      <SaveStrip busy={busy} result={result} />
      <SaveButton
        busy={busy}
        label="Save identity & contact"
        onClick={() =>
          void run(() =>
            c.saveIdentity({ name, phone, title, age, gender, nationality, orientation, summaryLine })
          )
        }
      />
    </SectionCard>
  );
}

export function ServicesSection({ c }: { c: MyAccountController }) {
  const listing = c.listing!;
  const optionList = c.isEscort
    ? c.modelServiceOptions
    : SERVICE_OPTIONS[listing.service_type ?? "other"] ?? SERVICE_OPTIONS.other;
  const [services, setServices] = useState<string[]>(listing.services_offered ?? []);
  const [languages, setLanguages] = useState<string[]>(listing.languages?.length ? listing.languages : ["English"]);
  const [availableDays, setAvailableDays] = useState<string[]>(c.daysOf(listing.availability));
  const [from, setFrom] = useState(c.timeOf(listing.availability, "from", "09:00"));
  const [to, setTo] = useState(c.timeOf(listing.availability, "to", "18:00"));
  const { busy, result, run } = useSectionSave();

  const toggle = (pool: string[], setPool: (next: string[]) => void) => (value: string) => {
    setPool(pool.includes(value) ? pool.filter((item) => item !== value) : [...pool, value]);
  };

  return (
    <SectionCard
      icon={<BadgeCheck className="h-5 w-5" />}
      title={c.isEscort ? "Experiences & availability" : "Services & availability"}
      description="What you offer and the days and hours you are around for it."
    >
      <Field
        label={c.isEscort ? "Hot offers" : "Services offered"}
        hint={optionList.length === 0 ? "The offer list is still loading…" : "Choose all that apply."}
      >
        <CheckboxGrid options={optionList} selected={services} onToggle={toggle(services, setServices)} />
      </Field>
      <Field label="Languages">
        <CheckboxGrid
          options={LANGUAGES}
          selected={languages}
          onToggle={toggle(languages, setLanguages)}
          columns={4}
        />
      </Field>
      <Field label="Days available">
        <CheckboxGrid
          options={DAYS}
          selected={availableDays}
          onToggle={toggle(availableDays, setAvailableDays)}
          columns={4}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Available from">
          <Input type="time" value={from} onChange={(event) => setFrom(event.target.value)} />
        </Field>
        <Field label="Available to">
          <Input type="time" value={to} onChange={(event) => setTo(event.target.value)} />
        </Field>
      </div>
      <SaveStrip busy={busy} result={result} />
      <SaveButton
        busy={busy}
        label="Save services & availability"
        onClick={() => void run(() => c.saveServices({ services, languages, availableDays, from, to }))}
      />
    </SectionCard>
  );
}

const COVERAGE_TIERS: Array<{ value: ServiceCoverageTier; label: string }> = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "remote", label: "Remote" },
];

/** Coverage editor - same gazetteer search as the onboarding wizard. */
function CoverageEditor({
  country,
  areas,
  onChange,
}: {
  country: string;
  areas: MyAccountController["areas"];
  onChange: (next: MyAccountController["areas"]) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Array<{ code: string; name: string; display_path: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      void searchLocations(trimmed, { countryCode: countryCodeForName(country) }).then((rows) => {
        if (cancelled) return;
        setHits(rows);
        setSearching(false);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, country]);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-bold text-foreground">Areas you serve (optional)</p>
      <div className="relative mt-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search areas in ${country}…`}
          aria-label="Search a service area"
        />
        {searching && (
          <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {hits.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {hits.map((hit) => (
              <li key={hit.code}>
                <button
                  type="button"
                  onClick={() => {
                    if (areas.some((area) => area.code === hit.code) || areas.length >= 12) return;
                    onChange([...areas, { code: hit.code, name: hit.name, display_path: hit.display_path, coverage: "secondary" }]);
                    setQuery("");
                    setHits([]);
                  }}
                  className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-semibold text-foreground">{hit.name}</span>
                  <span className="text-xs text-muted-foreground">{hit.display_path}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {areas.length > 0 && (
        <ul className="mt-3 space-y-2">
          {areas.map((area) => (
            <li key={area.code} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{area.name}</p>
                {area.display_path && (
                  <p className="truncate text-xs text-muted-foreground">{area.display_path}</p>
                )}
              </div>
              <select
                value={area.coverage}
                onChange={(event) =>
                  onChange(
                    areas.map((entry) =>
                      entry.code === area.code ? { ...entry, coverage: event.target.value as ServiceCoverageTier } : entry
                    )
                  )
                }
                aria-label={`Coverage for ${area.name}`}
                className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground"
              >
                {COVERAGE_TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange(areas.filter((entry) => entry.code !== area.code))}
                aria-label={`Remove ${area.name}`}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LocationSection({ c }: { c: MyAccountController }) {
  const listing = c.listing!;
  const [country, setCountry] = useState(listing.country ?? "Uganda");
  const [city, setCity] = useState(listing.city ?? "Kampala");
  const [neighborhood, setNeighborhood] = useState(listing.neighborhood ?? "");
  const [locationCode, setLocationCode] = useState(listing.location_code ?? "");
  const [travelKm, setTravelKm] = useState(listing.travel_km ?? "10");
  const [areas, setAreas] = useState(c.areas);
  const { busy, result, run } = useSectionSave();
  useEffect(() => setAreas(c.areas), [c.areas]);

  return (
    <SectionCard
      icon={<MapPin className="h-5 w-5" />}
      title="Location & coverage"
      description="Where you are based, how far you travel and the areas you serve."
    >
      <Field label="Registration location" hint="Country → region → city → neighbourhood, from the shared gazetteer.">
        <LocationCascader
          initialCode={locationCode || null}
          initialCountryCode={countryCodeForName(country)}
          fallback={
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput
                value={country}
                onChange={(value) => {
                  const legacyCountry = EAST_AFRICAN_COUNTRIES.find((item) => item.name === value);
                  setCountry(value);
                  setCity(legacyCountry?.cities[0] ?? "");
                  setNeighborhood("");
                  setLocationCode("");
                }}
              >
                {EAST_AFRICAN_COUNTRIES.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </SelectInput>
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
              <Input
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                placeholder="Neighbourhood"
              />
            </div>
          }
          onChange={(pick) => {
            if (!pick.country) return;
            setCountry(pick.country.name);
            const deepest = pick.trail.length > 1 ? pick.trail[pick.trail.length - 1] ?? null : null;
            const deepestType = deepest?.location_type;
            // Same tier fallbacks as the onboarding location step: districts
            // stand in for cities, DIVISION tiers and leaf towns for hoods.
            const cityNode =
              pick.city ?? (deepestType === "ADMIN2" || deepestType === "ADMIN_AREA" ? deepest : null);
            if (cityNode) setCity(cityNode.name);
            const hoodNode =
              pick.neighborhood ??
              (deepestType === "DIVISION" || deepestType === "ADMIN_AREA" ? deepest : null) ??
              (pick.isLeaf ? cityNode : null);
            setNeighborhood(hoodNode?.name ?? "");
            setLocationCode((pick.trail[pick.trail.length - 1] ?? pick.country).code);
          }}
        />
      </Field>
      {(city || neighborhood) && (
        <p className="text-xs text-muted-foreground">
          Current: {[neighborhood, city, country].filter(Boolean).join(", ")}
        </p>
      )}
      <Field label="Maximum travel distance">
        <RadioGroup
          name="account-travel"
          value={travelKm}
          onChange={setTravelKm}
          options={["5", "10", "20", "50", "anywhere"]}
          labels={["5 km", "10 km", "20 km", "50 km", `Anywhere in ${country}`]}
        />
      </Field>
      <CoverageEditor country={country} areas={areas} onChange={setAreas} />
      <SaveStrip busy={busy} result={result} />
      <SaveButton
        busy={busy}
        label="Save location & coverage"
        onClick={() =>
          void run(() =>
            c.saveLocation({ country, city, neighborhood, locationCode, travelKm, areas })
          )
        }
      />
    </SectionCard>
  );
}

export function MediaSection({ c }: { c: MyAccountController }) {
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async (media: (typeof c.existingMedia)[number]) => {
    setBusy(true);
    setNotice(null);
    const outcome = await c.removeMedia(media);
    setNotice(
      outcome.ok
        ? { kind: "ok", message: "Media removed from your profile." }
        : { kind: "error", message: outcome.message ?? "Media could not be removed." }
    );
    setBusy(false);
  };

  const refresh = async () => {
    setBusy(true);
    setNotice(null);
    const outcome = await c.refreshMedia();
    setNotice(
      outcome.ok
        ? { kind: "ok", message: "Media status refreshed." }
        : { kind: "error", message: outcome.message ?? "Media status could not be checked." }
    );
    setBusy(false);
  };

  const processingCount = c.existingMedia.filter(
    (item) => item.storageProvider !== "supabase" && !isMediaReady(item)
  ).length;

  return (
    <SectionCard
      icon={<ImagePlus className="h-5 w-5" />}
      title="Portfolio media"
      description="Photos and videos on your public profile. Removals apply immediately; uploads start as soon as you pick a file."
    >
      {processingCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <span>
            {processingCount} item{processingCount > 1 ? "s are" : " is"} still processing and will appear once ready.
          </span>
          <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => void refresh()} disabled={busy}>
            <RefreshCw className="mr-1 h-3 w-3" /> Check now
          </Button>
        </div>
      )}
      <PortfolioUploader queue={c.queue} existingMedia={c.existingMedia} onRemoveExisting={(media) => void remove(media)} disabled={busy} />
      {notice && (
        <p
          role="status"
          className={`rounded-xl border p-3 text-sm ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {notice.message}
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe2 className="h-3.5 w-3.5" /> Changes here go live on your profile arrays immediately, and re-enter review if the profile was verified.
      </p>
    </SectionCard>
  );
}
