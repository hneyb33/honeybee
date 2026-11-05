"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { ListingsTable } from "@/components/admin/modules/listings/ListingsTable";

export default function AdminModelsPage() {
  return (
    <AdminRoute
      eyebrow="Marketplace"
      title="Models"
      description="Companion profiles (kind = escort): verification, featuring and moderation."
    >
      <ListingsTable kind="escort" />
    </AdminRoute>
  );
}
