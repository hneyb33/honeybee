"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { ListingsTable } from "@/components/admin/modules/listings/ListingsTable";

export default function AdminProvidersPage() {
  return (
    <AdminRoute
      eyebrow="Marketplace"
      title="Service providers"
      description="Independent specialists and agencies (kind = service): verification, featuring and moderation."
    >
      <ListingsTable kind="service" />
    </AdminRoute>
  );
}
