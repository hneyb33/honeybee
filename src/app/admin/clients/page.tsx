"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { ClientsTable } from "@/components/admin/modules/clients/ClientsTable";

export default function AdminClientsPage() {
  return (
    <AdminRoute
      eyebrow="Marketplace"
      title="Clients"
      description="Customer accounts — the people booking models and providers."
    >
      <ClientsTable />
    </AdminRoute>
  );
}
