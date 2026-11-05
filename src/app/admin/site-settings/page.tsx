"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminSitePagesSettings } from "@/components/admin/AdminSitePagesSettings";

export default function AdminSiteSettingsPage() {
  return (
    <AdminRoute
      eyebrow="Platform"
      title="Site content"
      description="Marketing and policy pages served outside the marketplace flow."
      requiredCapability="site.edit"
    >
      <AdminCard>
        <AdminSitePagesSettings />
      </AdminCard>
    </AdminRoute>
  );
}
