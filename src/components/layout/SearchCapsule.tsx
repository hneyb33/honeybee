"use client";

import React, { useEffect, useState } from "react";
import { Search, MapPin, Navigation, Users, ChefHat } from "lucide-react";
import { EAST_AFRICA_LOCATIONS, SERVICE_CATEGORIES, SERVICE_TYPES } from "@/lib/data/uganda-locations";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface SearchCapsuleProps {
  location: string;
  category: string;
  serviceType: string;
  onSearch: (params: {
    location: string;
    category: string;
    serviceType: string;
    userCoords?: { latitude: number; longitude: number };
  }) => void;
}

export function SearchCapsule({
  location,
  category,
  serviceType,
  onSearch,
}: SearchCapsuleProps) {
  const [localLocation, setLocalLocation] = useState(location);
  const [localCategory, setLocalCategory] = useState(category);
  const [localService, setLocalService] = useState(serviceType);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setLocalLocation(location);
    setLocalCategory(category);
    setLocalService(serviceType);
  }, [location, category, serviceType]);

  const handleApply = (userCoords?: { latitude: number; longitude: number }) => {
    onSearch({
      location: localLocation,
      category: localCategory,
      serviceType: localService,
      userCoords,
    });
    setMobileOpen(false);
  };

  const handleNearYou = () => {
    if (!navigator.geolocation) {
      setGeoMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setLocalLocation("Near me");
        handleApply({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setGeoLoading(false);
        setGeoMessage("Please allow location access to discover providers near you.");
      }
    );
  };

  return (
    <div className="w-full">
      {/* Desktop Search Capsule */}
      <div className="hidden w-full items-center rounded-2xl border border-[#e2e4db] bg-white p-2 shadow-[0_12px_36px_rgba(28,54,39,0.09)] transition-shadow hover:shadow-[0_14px_42px_rgba(28,54,39,0.13)] md:flex dark:border-neutral-700 dark:bg-neutral-900">
        {/* Where Input */}
        <div className="min-w-0 flex-1 px-4">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#53675a] dark:text-neutral-300">Where</label>
          <input
            type="text"
            list="uganda-locations-list"
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
            placeholder="City, neighbourhood or area"
            className="w-full border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
        </div>

        {/* Category Select */}
        <div className="min-w-36 border-l border-[#e8e9e2] px-4 dark:border-neutral-700">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#53675a] dark:text-neutral-300">Category</label>
          <select
            value={localCategory}
            onChange={(e) => setLocalCategory(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-background text-foreground">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Service Type Select */}
        <div className="min-w-40 border-l border-[#e8e9e2] px-4 dark:border-neutral-700">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#53675a] dark:text-neutral-300">Service</label>
          <select
            value={localService}
            onChange={(e) => setLocalService(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            {Object.entries(SERVICE_TYPES).map(([key, val]) => (
              <option key={key} value={key} className="bg-background text-foreground">
                {val}
              </option>
            ))}
          </select>
        </div>

        {/* Geolocation Button */}
        <button
          type="button"
          onClick={handleNearYou}
          title="Search near your GPS location"
          className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-rose-950/30 hover:text-[#d3444d] dark:hover:bg-neutral-800"
        >
          <Navigation className={`h-4 w-4 ${geoLoading ? "animate-spin text-[#d3444d]" : ""}`} />
        </button>

        {/* Search CTA */}
        <button
          type="button"
          onClick={() => handleApply()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d3444d] text-white shadow-sm transition-transform hover:bg-[#ad3039] active:scale-95"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Pills & Sheet */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:border-[#78917e] dark:bg-neutral-900">
              <MapPin className="h-4 w-4 text-[#d3444d]" />
              <span className="max-w-28 truncate">{localLocation || "Where"}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl p-6">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Search Filter</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Location or Suburb</label>
                <input
                  type="text"
                  list="uganda-locations-list"
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="e.g. Kololo, Ntinda, Kira"
                  className="mt-1.5 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3444d]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={localCategory}
                  onChange={(e) => setLocalCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3444d]"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Service Specialty</label>
                <select
                  value={localService}
                  onChange={(e) => setLocalService(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3444d]"
                >
                  {Object.entries(SERVICE_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              {geoMessage && <p className="text-xs text-rose-500">{geoMessage}</p>}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleNearYou}
                  className="flex-1 rounded-xl"
                  disabled={geoLoading}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Near you
                </Button>
                <Button
                  onClick={() => handleApply()}
                  className="flex-1 rounded-xl bg-[#d3444d] text-white hover:bg-[#ad3039]"
                >
                  Search
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Mobile "Near You" Pill */}
        <button
          type="button"
          onClick={handleNearYou}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2.5 text-sm font-semibold shadow-sm hover:border-[#78917e] dark:bg-neutral-900"
        >
          <Navigation className={`h-3.5 w-3.5 text-[#d3444d] ${geoLoading ? "animate-spin" : ""}`} />
          Near you
        </button>

        {/* Quick Category Selector */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2.5 text-sm font-semibold shadow-sm hover:border-[#78917e] dark:bg-neutral-900"
        >
          <Users className="h-3.5 w-3.5" />
          {SERVICE_CATEGORIES.find((c) => c.value === localCategory)?.label || "Category"}
        </button>

        {/* Quick Service Selector */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2.5 text-sm font-semibold shadow-sm hover:border-[#78917e] dark:bg-neutral-900"
        >
          <ChefHat className="h-3.5 w-3.5" />
          {SERVICE_TYPES[localService] || "Services"}
        </button>
      </div>

      {/* Datalist for Suburb Autocompletion */}
      <datalist id="uganda-locations-list">
        {EAST_AFRICA_LOCATIONS.map((loc) => (
          <option key={`${loc.country}-${loc.area}-${loc.city}`} value={`${loc.area}, ${loc.city}`} />
        ))}
      </datalist>
    </div>
  );
}
