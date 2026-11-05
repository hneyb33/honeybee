"use client";

import { UsersTable } from "@/components/admin/modules/users/UsersTable";

/**
 * Client directory (`account_kind = 'client'`). Same table engine as the
 * people directory but scoped, with the lighter client-only filter set — this
 * is the "manage clients alone" surface from the module map.
 */
export function ClientsTable() {
  return <UsersTable variant="clients" />;
}
