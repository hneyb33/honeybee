"use client";

import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminForbidden } from "@/components/admin/ui/AdminForbidden";
import { useAdminSession } from "@/lib/admin/session";
import { can, type AdminCapability } from "@/lib/admin/permissions";

/**
 * Standard frame for every /admin/* route: page header (eyebrow, title,
 * description, actions), optional capability gate, and consistent bottom
 * spacing inside the shell's main column. The gate hides the *content* only —
 * real enforcement stays in the SECURITY DEFINER RPCs.
 */
export function AdminRoute({
  eyebrow,
  title,
  description,
  actions,
  requiredCapability,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  requiredCapability?: AdminCapability;
  children: ReactNode;
}) {
  const { role, ready } = useAdminSession();
  const gated = requiredCapability && !can(role, requiredCapability);
  return (
    <div className="pb-8">
      <AdminPageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {!ready ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900">
          Checking your access…
        </div>
      ) : gated ? (
        <AdminForbidden capability={requiredCapability} />
      ) : (
        children
      )}
    </div>
  );
}
