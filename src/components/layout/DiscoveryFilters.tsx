"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Navigation, RotateCcw } from "lucide-react";
import { SERVICE_TYPES } from "@/lib/data/uganda-locations";
import { searchLocations, type LocationHit } from "@/lib/locations";

export type DiscoveryStatus = "all" | "online" | "vip" | "premium" | "new" | "service";

interface DiscoveryFiltersProps {
  locationListId: string;
  /**
   * "horizontal" (default): pill rows scroll sideways — mobile.
   * "vertical": pills wrap onto new lines and the panel grows downward, meant
   * for the desktop sidebar which supplies its own vertical scroll.
   */
  layout?: "horizontal" | "vertical";
  locations: string[];
  location: string;
  orientation: string;
  serviceType: string;
  status: DiscoveryStatus;
  onLocationChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
  onServiceTypeChange: (value: string) => void;
  onStatusChange: (value: DiscoveryStatus) => void;
  onNearYou: (coordinates: { latitude: number; longitude: number }) => void;
  onReset: () => void;
}

const statuses: { id: DiscoveryStatus; label: string }[] = [
  { id: "all", label: "All profiles" },
  { id: "online", label: "Online now" },
  { id: "vip", label: "VIP" },
  { id: "premium", label: "Premium" },
  { id: "new", label: "New" },
  { id: "service", label: "Specialists" },
];

const orientations = [
  { value: "all", label: "All" },
  { value: "straight", label: "Straight" },
  { value: "bi-sexual", label: "Bi-sexual" },
  { value: "lesbian", label: "Lesbian" },
  { value: "gay", label: "Gay" },
];

/**
 * One free-text box drives every filter category: a word that names a pill
 * ("vip", "straight", "private chef"…) auto-applies that category, and anything
 * else falls through to the gazetteer / keytag location search. These maps are
 * the exact-match vocabulary for that classifier.
 */
type AutoApplied = {
  status?: DiscoveryStatus;
  orientation?: string;
  service?: string;
  location?: string;
};

const STATUS_TERMS: Record<string, DiscoveryStatus> = {
  online: "online",
  "online now": "online",
  active: "online",
  vip: "vip",
  premium: "premium",
  new: "new",
  service: "service",
  specialist: "service",
  specialists: "service",
};

const ORIENTATION_TERMS: Record<string, string> = Object.fromEntries(
  orientations
    .filter((item) => item.value !== "all")
    .flatMap((item) => [
      [item.value, item.value],
      [item.label.toLowerCase(), item.value],
    ])
);

const SERVICE_TERMS: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_TYPES).flatMap(([value, label]) => [
    [value, value],
    [value.replaceAll("_", " "), value],
    [String(label).toLowerCase(), value],
  ])
);

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3444d] ${
        active
          ? "border-[#d3444d] bg-[#d3444d] text-white shadow-sm"
          : "border-border bg-card text-foreground hover:border-[#c63843]/60 hover:text-[#c63843]"
      }`}
    >
      {children}
    </button>
  );
}

function PillSection({
  label,
  children,
  layout,
}: {
  label: string;
  children: React.ReactNode;
  layout: "horizontal" | "vertical";
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div
        className={
          layout === "vertical"
            ? "flex flex-wrap gap-1.5"
            : "flex gap-1.5 overflow-x-auto py-0.5 no-scrollbar"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function DiscoveryFilters({
  locationListId,
  layout = "horizontal",
  locations,
  location,
  orientation,
  serviceType,
  status,
  onLocationChange,
  onOrientationChange,
  onServiceTypeChange,
  onStatusChange,
  onNearYou,
  onReset,
}: DiscoveryFiltersProps) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [draft, setDraft] = useState(location === "Near me" ? "" : location);
  const [hits, setHits] = useState<LocationHit[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const autoRef = useRef<AutoApplied>({});
  const seqRef = useRef(0);
  const pendingRef = useRef(draft);
  const callbacksRef = useRef({ onLocationChange, onStatusChange, onServiceTypeChange, onOrientationChange });
  callbacksRef.current = { onLocationChange, onStatusChange, onServiceTypeChange, onOrientationChange };

  // Keep the box in step with pill / "Near me" changes coming from the parent,
  // without fighting the letter case the user just typed.
  useEffect(() => {
    const incoming = location === "Near me" ? "" : location;
    setDraft((current) =>
      current.trim().toLowerCase() === incoming.trim().toLowerCase() ? current : incoming
    );
  }, [location]);

  const applyDraft = useCallback(async (raw: string) => {
    const my = (seqRef.current += 1);
    const q = raw.trim().toLowerCase();
    const cb = callbacksRef.current;
    const prev = autoRef.current;
    const next: AutoApplied = {};

    const statusHit = q ? STATUS_TERMS[q] : undefined;
    const orientationHit = q ? ORIENTATION_TERMS[q] : undefined;
    const serviceHit = q ? SERVICE_TERMS[q] : undefined;

    if (statusHit || orientationHit || serviceHit) {
      next.status = statusHit;
      next.orientation = orientationHit;
      next.service = serviceHit;
      setHits([]);
    } else if (!q) {
      next.location = "";
      setHits([]);
    } else {
      // Not a known pill word: try the gazetteer, then fall back to the
      // all-facet keytag search the parent already runs on this text.
      let applied = raw.trim();
      if (q.length >= 2) {
        setSuggesting(true);
        const found = await searchLocations(q, { limit: 6 });
        if (my !== seqRef.current) return;
        setSuggesting(false);
        setHits(found);
        const exact = found.find((hit) => hit.name.toLowerCase() === q);
        if (exact) applied = exact.name;
      } else {
        setHits([]);
      }
      next.location = applied;
    }

    // Only touch categories this box drove automatically, so pills the user
    // clicked by hand survive unrelated typing.
    const sync = (category: keyof AutoApplied) => {
      const value = next[category];
      if (value === prev[category]) return;
      if (category === "status") cb.onStatusChange((value as DiscoveryStatus) ?? "all");
      if (category === "orientation") cb.onOrientationChange((value as string) ?? "all");
      if (category === "service") cb.onServiceTypeChange((value as string) ?? "all");
      if (category === "location") cb.onLocationChange((value as string) ?? "");
    };
    (["status", "orientation", "service", "location"] as const).forEach(sync);
    autoRef.current = next;
  }, []);

  // Debounced auto-search: every pause in typing re-classifies the query.
  useEffect(() => {
    if (draft === pendingRef.current) return;
    pendingRef.current = draft;
    const timer = setTimeout(() => void applyDraft(draft), 350);
    return () => clearTimeout(timer);
  }, [draft, applyDraft]);

  const pickHit = (hit: LocationHit) => {
    seqRef.current += 1;
    pendingRef.current = hit.name;
    autoRef.current = { ...autoRef.current, location: hit.name };
    onLocationChange(hit.name);
    setDraft(hit.name);
    setHits([]);
  };

  const resetAll = () => {
    seqRef.current += 1;
    autoRef.current = {};
    pendingRef.current = "";
    setDraft("");
    setHits([]);
    onReset();
  };

  const findNearYou = () => {
    if (!navigator.geolocation) {
      setGeoError("Location access is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        onNearYou({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setGeoLoading(false);
        setGeoError(`Could not determine your location: ${error.message}`);
      }
    );
  };

  // In vertical mode every location stays reachable by wrapping; in horizontal
  // mode keep the pill row focused with the first 12 suggestions.
  const locationPills = layout === "vertical" ? locations : locations.slice(0, 12);
  const activeLocation = location === "Near me" ? "" : location;

  const groups = (
    <>
      <PillSection label="Location" layout={layout}>
        <button
          type="button"
          onClick={findNearYou}
          aria-pressed={location === "Near me"}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3444d] ${
            location === "Near me"
              ? "border-[#d3444d] bg-[#d3444d] text-white"
              : "border-border bg-card text-foreground hover:border-[#c63843]/60 hover:text-[#c63843]"
          }`}
        >
          <Navigation className={`h-3.5 w-3.5 ${geoLoading ? "animate-pulse" : ""}`} />
          {geoLoading ? "Locating" : "Near me"}
        </button>
        {locationPills.map((place) => (
          <Pill
            key={place}
            active={activeLocation === place}
            onClick={() => onLocationChange(activeLocation === place ? "" : place)}
          >
            <MapPin className="h-3 w-3" />
            {place}
          </Pill>
        ))}
      </PillSection>

      <PillSection label="Orientation" layout={layout}>
        {orientations.map((item) => (
          <Pill
            key={item.value}
            active={orientation === item.value}
            onClick={() => onOrientationChange(item.value)}
          >
            {item.label}
          </Pill>
        ))}
      </PillSection>

      <PillSection label="Specialty" layout={layout}>
        {Object.entries(SERVICE_TYPES).map(([value, label]) => (
          <Pill
            key={value}
            active={serviceType === value}
            onClick={() => onServiceTypeChange(value)}
          >
            {label}
          </Pill>
        ))}
      </PillSection>

      <PillSection label="Discover" layout={layout}>
        {statuses.map((item) => (
          <Pill key={item.id} active={status === item.id} onClick={() => onStatusChange(item.id)}>
            {item.label}
            {item.id === "online" && <span className={`h-1.5 w-1.5 rounded-full ${status === item.id ? "bg-white" : "bg-emerald-500"}`} />}
          </Pill>
        ))}
      </PillSection>
    </>
  );

  return (
    <>
      <datalist id={locationListId}>
        {locations.map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>

      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-3">
        <div className="flex items-center gap-2">
          <span className={`relative flex items-center gap-2 rounded-full border border-border bg-card px-3 ${location ? "ring-1 ring-[#d3444d]/40" : ""}`}>
            <MapPin className="h-4 w-4 shrink-0 text-[#a8343e]" />
            <input
              type="text"
              list={locationListId}
              value={draft === "Near me" ? "" : draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void applyDraft(draft);
                }
                if (event.key === "Escape") setHits([]);
              }}
              placeholder="Search Kampala, Kololo, chef, VIP…"
              className="h-9 w-full min-w-28 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search locations, specialties, orientations and statuses"
            />
            {suggesting && (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            )}
            {(location || orientation !== "all" || serviceType !== "all" || status !== "all") && (
              <button
                type="button"
                onClick={resetAll}
                aria-label="Reset all filters"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-[#c63843]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {hits.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl">
                <li>
                  <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Locations
                  </p>
                </li>
                {hits.map((hit) => (
                  <li key={hit.code}>
                    <button
                      type="button"
                      onClick={() => pickHit(hit)}
                      className="flex w-full flex-col px-3 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <span className="text-sm font-semibold text-foreground">{hit.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{hit.display_path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </span>
        </div>
        <div className="space-y-2.5">{groups}</div>
        {geoError && <p role="alert" className="text-xs text-destructive">{geoError}</p>}
      </div>
    </>
  );
}
