"use client";

import { UsersTable } from "@/components/admin/modules/users/UsersTable";
import { AdminForbidden } from "@/components/admin/ui/AdminForbidden";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

/**
 * Admin staff directory (super_admin only). Deliberately a thin, capability-
 * gated wrapper over `UsersTable` in its `admins` variant: promote/demote and
 * delete already flow through the audited `admin_set_profile_role` /
 * `admin_delete_profile` RPCs there, and a second implementation would risk
 * the two views drifting apart.
 */
export function AdminRolesTable() {
  const { role } = useAdminSession();
  if (!can(role, "users.roleChange")) return <AdminForbidden capability="users.roleChange" />;
  return <UsersTable variant="admins" />;
}
