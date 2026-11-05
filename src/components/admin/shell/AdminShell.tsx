"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { useAdminSession } from "@/lib/admin/session";
import { useAnalytics } from "@/lib/admin/analytics";

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { role, profile } = useAdminSession();
  const analytics = useAnalytics("30d");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const counters = analytics.error
    ? undefined
    : {
        pendingListings: analytics.totals.pendingListings,
        pendingPayments: analytics.totals.pendingPayments,
        pendingAds: analytics.totals.pendingAds,
        openFlags: analytics.totals.openFlags,
      };

  return (
    <div className="admin-shell min-h-screen bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto flex w-full max-w-[1600px] gap-0">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
          <Brand />
          <AdminSidebar role={role} counters={counters} />
          <FooterNote name={profile?.name ?? "Admin"} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Honeybee admin navigation</SheetTitle>
            <Brand />
            <AdminSidebar role={role} counters={counters} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/admin"
      className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-neutral-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b82ff] text-white shadow">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-base font-bold leading-tight tracking-tight">Honeybee</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
      </div>
    </Link>
  );
}

function FooterNote({ name }: { name: string }) {
  return (
    <div className="border-t border-slate-200 p-4 text-[11px] text-muted-foreground dark:border-neutral-800">
      <p className="font-semibold text-slate-500 dark:text-neutral-400">Signed in as {name}</p>
      <p className="mt-1">Every action is audit-logged.</p>
    </div>
  );
}
