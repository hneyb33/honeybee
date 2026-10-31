"use client";

import React, { useState } from "react";
import { MapPin, Navigation, RotateCcw } from "lucide-react";
import { SERVICE_TYPES } from "@/lib/data/uganda-locations";

export type DiscoveryStatus = "all" | "online" | "vip" | "premium" | "new" | "service";

interface DiscoveryFiltersProps {
  locationListId: string;
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
  scroll,
}: {
  label: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className={`flex gap-1.5 ${scroll ? "overflow-x-auto py-0.5 no-scrollbar" : "flex-wrap"}`}>
        {children}
      </div>
    </div>
  );
}

export function DiscoveryFilters({
  locationListId,
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

  // Keep the pill row focused: show up to 12 suggestions (cities first, then
  // neighbourhoods); everything else stays reachable via the search field.
  const locationPills = locations.slice(0, 12);
  const activeLocation = location === "Near me" ? "" : location;

  const groups = (
    <>
      <PillSection label="Location" scroll>
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

      <PillSection label="Orientation" scroll>
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

      <PillSection label="Specialty" scroll>
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

      <PillSection label="Discover" scroll>
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
          <span className={`flex items-center gap-2 rounded-full border border-border bg-card px-3 ${location ? "ring-1 ring-[#d3444d]/40" : ""}`}>
            <MapPin className="h-4 w-4 shrink-0 text-[#a8343e]" />
            <input
              type="text"
              list={locationListId}
              value={location === "Near me" ? "" : location}
              onChange={(event) => onLocationChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder="Search Kampala, Kololo, chef, VIP…"
              className="h-9 w-full min-w-28 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search by location or keyword"
            />
            {(location || orientation !== "all" || serviceType !== "all" || status !== "all") && (
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset all filters"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-[#c63843]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        </div>
        <div className="space-y-2.5">{groups}</div>
        {geoError && <p role="alert" className="text-xs text-destructive">{geoError}</p>}
      </div>
    </>
  );
}
