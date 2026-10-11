"use client";

import React, { useState } from "react";
import { MapPin, Navigation, RotateCcw } from "lucide-react";
import { SERVICE_TYPES, UGANDA_LOCATIONS } from "@/lib/data/uganda-locations";

export type DiscoveryStatus = "all" | "online" | "vip" | "premium" | "new" | "service";

interface DiscoveryFiltersProps {
  locationListId: string;
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
  { value: "all", label: "All orientations" },
  { value: "straight", label: "Straight" },
  { value: "bi-sexual", label: "Bi-sexual" },
  { value: "lesbian", label: "Lesbian" },
  { value: "gay", label: "Gay" },
];

export function DiscoveryFilters({
  locationListId,
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

  const selects = (
    compact: boolean
  ) => (
    <>
      <label className="block shrink-0">
        {!compact && <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Location</span>}
        <span className={`flex items-center gap-2 ${compact ? "rounded-full border border-border bg-card px-3" : "rounded-xl border border-border bg-card px-3"}`}>
          <MapPin className="h-4 w-4 shrink-0 text-[#a8343e]" />
          <input
            type="text"
            list={locationListId}
            value={location === "Near me" ? "" : location}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Location"
            className={`min-w-24 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground ${compact ? "h-10 w-32" : "h-10 w-full"}`}
            aria-label="Filter by city or neighbourhood"
          />
        </span>
      </label>

      <label className="block shrink-0">
        {!compact && <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Orientation</span>}
        <select
          value={orientation}
          onChange={(event) => onOrientationChange(event.target.value)}
          aria-label="Filter by orientation"
          className={`appearance-none border border-border bg-card text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#d3444d] ${compact ? "h-10 max-w-40 rounded-full px-3" : "h-10 w-full rounded-xl px-3"}`}
        >
          {orientations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>

      <label className="block shrink-0">
        {!compact && <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Specialty</span>}
        <select
          value={serviceType}
          onChange={(event) => onServiceTypeChange(event.target.value)}
          aria-label="Filter by specialty"
          className={`appearance-none border border-border bg-card text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#d3444d] ${compact ? "h-10 max-w-40 rounded-full px-3" : "h-10 w-full rounded-xl px-3"}`}
        >
          {Object.entries(SERVICE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      <label className="block shrink-0">
        {!compact && <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Discover</span>}
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as DiscoveryStatus)}
          aria-label="Filter online, featured, new or specialist profiles"
          className={`appearance-none border border-border bg-card text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#d3444d] ${compact ? "h-10 max-w-36 rounded-full px-3" : "h-10 w-full rounded-xl px-3"}`}
        >
          {statuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </>
  );

  return (
    <>
      <datalist id={locationListId}>
        {Array.from(new Set(UGANDA_LOCATIONS.map((place) => `${place.area}, ${place.city}`))).map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>

      <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar md:hidden">
        {selects(true)}
        <button
          type="button"
          onClick={findNearYou}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground"
        >
          <Navigation className={`h-4 w-4 text-[#a8343e] ${geoLoading ? "animate-pulse" : ""}`} />
          {geoLoading ? "Locating" : "Near me"}
        </button>
      </div>
      {geoError && <p role="alert" className="mt-2 text-xs text-destructive md:hidden">{geoError}</p>}

      <aside className="hidden w-full rounded-2xl border border-border bg-card p-4 shadow-sm md:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Refine your search</h2>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-[#c63843]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">{selects(false)}</div>
          <button
            type="button"
            onClick={findNearYou}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-[#c63843] hover:text-[#c63843]"
          >
            <Navigation className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
            {geoLoading ? "Locating..." : "Use my location"}
          </button>
          {geoError && <p role="alert" className="text-xs text-destructive">{geoError}</p>}
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Browse by</p>
            <div className="space-y-1">
              {statuses.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onStatusChange(item.id)}
                  aria-pressed={status === item.id}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    status === item.id
                      ? "bg-[#d3444d] font-semibold text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                  {item.id === "online" && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                  {item.id === "vip" && <span className="h-2 w-2 rounded-full bg-[#d3444d]" />}
                  {item.id === "new" && <span className="h-2 w-2 rounded-full bg-white ring-1 ring-neutral-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
