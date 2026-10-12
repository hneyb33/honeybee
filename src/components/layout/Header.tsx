"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  Video,
  Images,
  Building2,
  PanelsTopLeft,
  Contact,
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
  const pathname = usePathname();
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

  const secondaryLinks = [
    { href: "/escort-videos", label: "Escort videos", icon: Video },
    { href: "/escort-images", label: "Escort images", icon: Images },
    { href: "/agencies", label: "Agencies", icon: Building2 },
    { href: "/classified-ads", label: "Classified ads", icon: PanelsTopLeft },
    { href: "/contact", label: "Contact us", icon: Contact },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl transition-shadow ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <Image
            src="/images/logo.jpeg"
            alt="Honeybee"
            width={40}
            height={40}
            className="h-10 w-10 rounded-2xl object-cover shadow-sm transition-transform group-hover:-rotate-6"
            priority
          />
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-tight text-[#1b3028] dark:text-white">
              Honeybee
            </span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#718177] dark:text-neutral-400">
              Local, connected
            </span>
          </span>
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
      <nav aria-label="Explore Honeybee" className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 no-scrollbar sm:justify-center sm:px-8">
          {secondaryLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4 ${
                  active
                    ? "bg-rose-500/10 text-rose-300"
                    : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
