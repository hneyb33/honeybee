"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { NAV_GROUPS, isNavItemActive, type NavItem } from "@/components/admin/shell/nav-config";
import { can, type AdminRole } from "@/lib/admin/permissions";

export interface SidebarCounters {
  pendingListings: number;
  pendingPayments: number;
  pendingAds: number;
  openFlags: number;
}

export function AdminSidebar({
  role,
  counters,
  onNavigate,
}: {
  role: AdminRole | null;
  counters?: Partial<SidebarCounters>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 pb-8 pt-4 text-sm">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.requiredCapability || can(role, item.requiredCapability),
        );
        if (items.length === 0) return null;
        return (
          <div key={group.id} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={isNavItemActive(pathname, item)}
                  badge={item.badgeKey ? counters?.[item.badgeKey] ?? 0 : 0}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-[#5b82ff] text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
        }`}
      >
        <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400 dark:text-neutral-400"}`} />
        <span className="flex-1 truncate">{item.label}</span>
        {badge > 0 && (
          <Badge
            variant={active ? "outline" : "secondary"}
            className={`ml-auto text-[10px] font-bold ${
              active ? "border-white/40 bg-white/20 text-white" : ""
            }`}
          >
            {badge}
          </Badge>
        )}
      </Link>
    </li>
  );
}
