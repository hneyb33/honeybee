import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  GitCompareArrows,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  Megaphone,
  ReceiptText,
  Settings2,
  Shield,
  ShoppingBag,
  Sprout,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { AdminCapability } from "@/lib/admin/permissions";

/**
 * Static description of every sidebar entry. `requiredCapability` gates the
 * item to only those roles allowed to see it; omit it and everyone who can
 * reach /admin sees the entry.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredCapability?: AdminCapability;
  badgeKey?: "pendingListings" | "pendingPayments" | "pendingAds" | "openFlags";
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: Activity, requiredCapability: "analytics.view" },
      { href: "/admin/verifications", label: "Verifications", icon: UserCheck, requiredCapability: "verifications.review", badgeKey: "pendingListings" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { href: "/admin/models", label: "Models", icon: UserRound },
      { href: "/admin/providers", label: "Service providers", icon: Building2 },
      { href: "/admin/listings", label: "All listings", icon: List },
      { href: "/admin/clients", label: "Clients", icon: Users, requiredCapability: "users.read" },
    ],
  },
  {
    id: "ads",
    label: "Advertising",
    items: [
      { href: "/admin/ads", label: "Ads", icon: Megaphone, badgeKey: "pendingAds" },
      { href: "/admin/services", label: "Service catalogue", icon: ShoppingBag, requiredCapability: "services.edit" },
      { href: "/admin/domains", label: "Locations", icon: Globe2, requiredCapability: "domains.edit" },
    ],
  },
  {
    id: "revenue",
    label: "Billing",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, badgeKey: "pendingPayments" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeDollarSign },
      { href: "/admin/billing-settings", label: "Billing settings", icon: Settings2, requiredCapability: "billing.edit" },
    ],
  },
  {
    id: "people",
    label: "People & roles",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, requiredCapability: "users.read" },
      { href: "/admin/roles", label: "Admin staff", icon: Shield, requiredCapability: "users.roleChange" },
      { href: "/admin/flags", label: "Flags", icon: Sprout, requiredCapability: "flags.manage", badgeKey: "openFlags" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { href: "/admin/site-settings", label: "Site content", icon: FileText, requiredCapability: "site.edit" },
      { href: "/admin/media", label: "Media pipeline", icon: ImageIcon, requiredCapability: "media.diagnose" },
      { href: "/admin/audit", label: "Audit log", icon: GitCompareArrows, requiredCapability: "audit.read" },
      { href: "/admin/timeline", label: "Ad timeline", icon: CalendarClock, requiredCapability: "ads.moderate" },
      { href: "/admin/records", label: "Payment records", icon: ReceiptText, requiredCapability: "payments.review" },
    ],
  },
];

export const NAV_BY_HREF = new Map<string, NavItem>(
  NAV_GROUPS.flatMap((group) => group.items).map((item) => [item.href, item]),
);

/** Breadcrumb trail for the topbar; derived from the current pathname. */
export function breadcrumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  const trimmed = pathname.replace(/^\/admin/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const trail: Array<{ label: string; href?: string }> = [{ label: "Admin", href: "/admin" }];
  let cursor = "/admin";
  for (const segment of segments) {
    cursor = `${cursor}/${segment}`;
    const match = NAV_BY_HREF.get(cursor);
    trail.push({ label: match?.label ?? segment, href: match ? cursor : undefined });
  }
  return trail;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
