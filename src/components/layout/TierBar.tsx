"use client";

import React from "react";
import { LayoutGrid, Crown, Sparkles, ChefHat, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierBarProps {
  activeTier: string;
  onSelectTier: (tier: string) => void;
}

export function TierBar({ activeTier, onSelectTier }: TierBarProps) {
  const tiers = [
    { id: "all", label: "Everyone", icon: LayoutGrid },
    { id: "service", label: "Specialists", icon: ChefHat, accent: "text-emerald-700 dark:text-emerald-300" },
    { id: "vip", label: "Featured", icon: Crown, accent: "text-amber-600 dark:text-amber-400" },
    { id: "premium", label: "Premium", icon: Sparkles, accent: "text-emerald-700 dark:text-emerald-300" },
    { id: "female", label: "Women", icon: Heart },
    { id: "male", label: "Men", icon: Users },
  ];

  return (
    <div className="w-full border-y border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-start gap-2 overflow-x-auto px-5 py-3 no-scrollbar sm:justify-center sm:gap-3 sm:px-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isActive = activeTier === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelectTier(tier.id)}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#367458]",
                isActive
                  ? "bg-[#eaf0e9] text-[#285d47] dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive
                    ? tier.accent || "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{tier.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
