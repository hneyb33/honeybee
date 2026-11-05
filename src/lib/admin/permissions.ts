/**
 * Role/permission matrix for the admin dashboard.
 *
 * Two admin roles exist in `profiles.role`: `super_admin` (owner, unrestricted)
 * and `moderator` (day-to-day content + payment reviewer). Every gated UI action
 * maps to one capability key below so pages and nav can be filtered uniformly.
 *
 * Server-side enforcement lives in the SQL RPCs (`is_admin()`, `is_super_admin()`).
 * This module only mirrors the same rules for the client so the UI does not offer
 * actions the caller cannot execute.
 */

export type AdminRole = "super_admin" | "moderator";

export type AdminCapability =
  | "ads.moderate"
  | "ads.feature"
  | "ads.edit"
  | "ads.delete"
  | "listings.moderate"
  | "listings.edit"
  | "listings.delete"
  | "verifications.review"
  | "payments.review"
  | "payments.delete"
  | "subscriptions.edit"
  | "users.read"
  | "users.edit"
  | "users.roleChange"
  | "users.delete"
  | "flags.manage"
  | "billing.edit"
  | "services.edit"
  | "domains.edit"
  | "site.edit"
  | "media.diagnose"
  | "analytics.view"
  | "audit.read";

const MODERATOR_CAPS: ReadonlySet<AdminCapability> = new Set<AdminCapability>([
  "ads.moderate",
  "ads.feature",
  "listings.moderate",
  "verifications.review",
  "payments.review",
  "users.read",
  "media.diagnose",
  "analytics.view",
  "flags.manage",
]);

const SUPER_ADMIN_CAPS: ReadonlySet<AdminCapability> = new Set<AdminCapability>([
  "ads.moderate",
  "ads.feature",
  "ads.edit",
  "ads.delete",
  "listings.moderate",
  "listings.edit",
  "listings.delete",
  "verifications.review",
  "payments.review",
  "payments.delete",
  "subscriptions.edit",
  "users.read",
  "users.edit",
  "users.roleChange",
  "users.delete",
  "flags.manage",
  "billing.edit",
  "services.edit",
  "domains.edit",
  "site.edit",
  "media.diagnose",
  "analytics.view",
  "audit.read",
]);

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "super_admin" || role === "moderator";
}

export function can(role: AdminRole | null | undefined, capability: AdminCapability): boolean {
  if (role === "super_admin") return SUPER_ADMIN_CAPS.has(capability);
  if (role === "moderator") return MODERATOR_CAPS.has(capability);
  return false;
}

/** Convenience helper for `useMemo`-ing capability predicates in components. */
export function makeCan(role: AdminRole | null | undefined) {
  return (capability: AdminCapability) => can(role, capability);
}
