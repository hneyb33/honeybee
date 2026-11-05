"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminRolesTable } from "@/components/admin/modules/roles/AdminRolesTable";

export default function AdminRolesPage() {
  return (
    <AdminRoute
      eyebrow="People & roles"
      title="Admin staff"
      description="Promote, demote and remove moderators. Only super admins can open this page."
      requiredCapability="users.roleChange"
    >
      <AdminRolesTable />
    </AdminRoute>
  );
}
