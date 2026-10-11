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
    { id: "all", label: "All", icon: LayoutGrid },
    { id: "vip", label: "VIP", icon: Crown, accent: "text-amber-500" },
    { id: "premium", label: "Premium", icon: Sparkles, accent: "text-rose-500" },
    { id: "service", label: "Specialists", icon: ChefHat, accent: "text-emerald-500" },
    { id: "female", label: "Women", icon: Heart },
    { id: "male", label: "Men", icon: Users },
  ];

  return (
    <div className="w-full border-b border-border/60 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-start sm:justify-center gap-6 sm:gap-10 overflow-x-auto px-4 py-3 no-scrollbar">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isActive = activeTier === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelectTier(tier.id)}
              className={cn(
                "group relative flex shrink-0 flex-col items-center gap-1.5 pb-2 text-xs font-medium transition-all focus:outline-none",
                isActive
                  ? "text-neutral-900 font-semibold dark:text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive
                    ? tier.accent || "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{tier.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-full bg-neutral-900 rounded-full dark:bg-white animate-in fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
