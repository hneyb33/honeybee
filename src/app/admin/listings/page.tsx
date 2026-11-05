"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { ListingsTable } from "@/components/admin/modules/listings/ListingsTable";

export default function AdminListingsPage() {
  return (
    <AdminRoute
      eyebrow="Marketplace"
      title="All listings"
      description="Every companion and service profile on the marketplace, across all moderation states."
    >
      <ListingsTable />
    </AdminRoute>
  );
}
