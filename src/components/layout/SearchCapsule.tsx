"use client";

import React, { useState } from "react";
import { Search, MapPin, Navigation, Users, ChefHat } from "lucide-react";
import { UGANDA_LOCATIONS, SERVICE_CATEGORIES, SERVICE_TYPES } from "@/lib/data/uganda-locations";
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
    <div className="w-full px-4 pt-3 pb-2 sm:px-6">
      {/* Desktop Search Capsule */}
      <div className="hidden md:flex mx-auto max-w-4xl items-center rounded-full border border-border bg-card py-2 pl-6 pr-2 shadow-[0_3px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow">
        {/* Where Input */}
        <div className="min-w-0 flex-1 pr-4">
          <label className="block text-xs font-semibold text-foreground">Where</label>
          <input
            type="text"
            list="uganda-locations-list"
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
            placeholder="Search Kampala area (e.g. Kololo, Ntinda)"
            className="w-full border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
        </div>

        {/* Category Select */}
        <div className="min-w-40 border-l border-border px-4">
          <label className="block text-xs font-semibold text-foreground">Category</label>
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
        <div className="min-w-44 border-l border-border px-4">
          <label className="block text-xs font-semibold text-foreground">Service</label>
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
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors dark:hover:bg-neutral-800"
        >
          <Navigation className={`h-4 w-4 ${geoLoading ? "animate-spin text-airbnb-coral" : ""}`} />
        </button>

        {/* Search CTA */}
        <button
          type="button"
          onClick={() => handleApply()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-airbnb-coral text-white shadow-md hover:bg-[#E00B41] transition-transform active:scale-95 shrink-0"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Pills & Sheet */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:border-foreground">
              <MapPin className="h-4 w-4 text-airbnb-coral" />
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
                  className="mt-1.5 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-airbnb-coral"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={localCategory}
                  onChange={(e) => setLocalCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-airbnb-coral"
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
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-airbnb-coral"
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
                  className="flex-1 rounded-xl bg-airbnb-coral text-white hover:bg-[#E00B41]"
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium shadow-sm hover:border-foreground"
        >
          <Navigation className={`h-3.5 w-3.5 text-airbnb-coral ${geoLoading ? "animate-spin" : ""}`} />
          Near you
        </button>

        {/* Quick Category Selector */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium shadow-sm hover:border-foreground"
        >
          <Users className="h-3.5 w-3.5" />
          {SERVICE_CATEGORIES.find((c) => c.value === localCategory)?.label || "Category"}
        </button>

        {/* Quick Service Selector */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium shadow-sm hover:border-foreground"
        >
          <ChefHat className="h-3.5 w-3.5" />
          {SERVICE_TYPES[localService] || "Services"}
        </button>
      </div>

      {/* Datalist for Suburb Autocompletion */}
      <datalist id="uganda-locations-list">
        {UGANDA_LOCATIONS.map((loc) => (
          <option key={`${loc.area}-${loc.city}`} value={`${loc.area}, ${loc.city}`} />
        ))}
      </datalist>
    </div>
  );
}
