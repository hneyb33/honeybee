"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { FlagsTable } from "@/components/admin/modules/flags/FlagsTable";

export default function AdminFlagsPage() {
  return (
    <AdminRoute
      eyebrow="Trust & safety"
      title="Flags"
      description="Profiles, listings, ads and payments raised for a second look."
      requiredCapability="flags.manage"
    >
      <FlagsTable />
    </AdminRoute>
  );
}
