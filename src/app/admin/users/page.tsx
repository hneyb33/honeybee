"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { UsersTable } from "@/components/admin/modules/users/UsersTable";

export default function AdminUsersPage() {
  return (
    <AdminRoute
      eyebrow="People & roles"
      title="Users"
      description="Everyone with an account: clients, models, specialists, agencies and staff."
      requiredCapability="users.read"
    >
      <UsersTable />
    </AdminRoute>
  );
}
