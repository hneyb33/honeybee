"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  LayoutDashboard,
  BadgePlus,
  UserPlus,
  LogIn,
  LogOut,
  Menu,
  Shield,
  Crown,
  ChefHat,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const client = supabase;
    if (!client) return () => window.removeEventListener("scroll", handleScroll);

    const syncUser = async (userId: string, email: string | undefined) => {
      const { data: profile, error } = await client
        .from("profiles")
        .select("name,role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Could not load the signed-in profile:", error.message);
        setUser(null);
        return;
      }

      setUser(profile ? { name: profile.name, role: profile.role } : email ? { name: email, role: "" } : null);
    };

    client.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Could not restore the signed-in session:", error.message);
        return;
      }
      if (data.user) void syncUser(data.user.id, data.user.email);
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void syncUser(session.user.id, session.user.email);
      else setUser(null);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Could not sign out:", error.message);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl transition-shadow ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-8 sm:py-3.5">
        <Link href="/" aria-label="Honeybee home" className="group flex shrink-0 items-center">
          <Image
            src="/images/footerbg.jpeg"
            alt="Honeybee"
            width={180}
            height={59}
            sizes="(max-width: 639px) 108px, (max-width: 1023px) 148px, 180px"
            className="h-9 w-[108px] object-contain transition-opacity group-hover:opacity-85 sm:h-[49px] sm:w-[148px] lg:h-[59px] lg:w-[180px]"
            priority
          />
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-3 py-2 font-semibold text-[#f17d83] transition-colors hover:bg-neutral-800"
          >
            <Compass className="h-4 w-4" />
            Discover
          </Link>
          <Link
            href="/subscribe"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Crown className="h-4 w-4 text-[#c18d2c]" />
            Membership
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* List Your Profile / Host CTA */}
          <Link href="/advertise" aria-label="Post an ad">
            <Button
              variant="ghost"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c63843] hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-neutral-800"
            >
              <BadgePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Post an ad</span>
            </Button>
          </Link>

          {/* User Profile / Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-3 pr-1.5 shadow-sm hover:shadow-md transition-shadow focus:outline-none dark:border-neutral-700"
                aria-label="Account Menu"
              >
                <Menu className="h-4 w-4 text-muted-foreground" />
                <Avatar className="h-7 w-7 bg-neutral-800 text-white dark:bg-white dark:text-neutral-900">
                  <AvatarFallback className="text-xs font-semibold">
                    {user ? user.name.slice(0, 1).toUpperCase() : "G"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                    Signed in as <span className="font-semibold text-foreground">{user.name}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Client Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/provider" className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Provider Operations
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === "super_admin" || user.role === "moderator") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Subscriptions & VIP
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2 font-semibold">
                      <LogIn className="h-4 w-4" />
                      Log in
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Register as
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/provider/onboarding" className="flex items-center gap-2">
                      <BadgePlus className="h-4 w-4" />
                      Become a Provider
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Explore featured profiles
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
