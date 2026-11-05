"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { CategoriesTable } from "@/components/admin/modules/domains/CategoriesTable";
import { ProviderLocationsTable } from "@/components/admin/modules/domains/ProviderLocationsTable";

export default function AdminDomainsPage() {
  return (
    <AdminRoute
      eyebrow="Catalogue"
      title="Domains & locations"
      description="Category dictionaries and the country/city/area vocabulary used by search."
      requiredCapability="domains.edit"
    >
      <div className="space-y-6">
        <ProviderLocationsTable />
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoriesTable table="listings" />
          <CategoriesTable table="ads" />
        </div>
      </div>
    </AdminRoute>
  );
}
