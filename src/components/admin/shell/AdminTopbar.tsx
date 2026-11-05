"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { breadcrumbsFor } from "@/components/admin/shell/nav-config";
import { useAdminSession } from "@/lib/admin/session";

export function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAdminSession();
  const { resolvedTheme, setTheme } = useTheme();
  const crumbs = breadcrumbsFor(pathname);
  const initials = profile?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-xl lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm md:flex">
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q");
            const q = typeof value === "string" ? value.trim() : "";
            if (q) window.location.href = `/admin/users?q=${encodeURIComponent(q)}`;
          }}
          className="relative hidden md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search users"
            className="h-9 w-56 rounded-xl pl-9 text-sm"
          />
        </form>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-xl"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              <Avatar className="h-8 w-8">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="bg-[#5b82ff] text-xs font-bold text-white">
                  {initials || "AD"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
                <span className="truncate font-semibold leading-tight">{profile?.name ?? "Admin"}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {profile?.role === "super_admin" ? "Super admin" : "Moderator"}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <div className="px-2 py-1.5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed in</p>
              <p className="mt-0.5 truncate text-xs font-medium text-foreground">{profile?.email ?? "No email"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/audit">Audit log</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/analytics">Analytics</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
