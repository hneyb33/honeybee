"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Compass,
  LayoutDashboard,
  BadgePlus,
  UserPlus,
  LogIn,
  LogOut,
  Sun,
  Moon,
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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    setMounted(true);
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
      className={`sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-shadow ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-9 w-32 sm:h-10 sm:w-36">
            <Image
              src="/images/logo-lightmode.jpeg"
              alt="Honeybee"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/images/logo-darkmode.jpeg"
              alt="Honeybee"
              fill
              className="hidden object-contain dark:block"
              priority
            />
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 border-b-2 border-neutral-900 pb-1 font-semibold text-neutral-900 dark:border-white dark:text-white"
          >
            <Compass className="h-4 w-4" />
            Explore
          </Link>
          <Link
            href="/subscribe"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Crown className="h-4 w-4 text-amber-500" />
            VIP & Plans
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* List Your Profile / Host CTA */}
          <Link href="/provider/onboarding">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <BadgePlus className="h-4 w-4 text-airbnb-coral" />
              <span>List your profile</span>
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
                      View VIP escorts
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
