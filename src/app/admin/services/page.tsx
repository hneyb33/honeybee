"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { ServiceOptionsTable } from "@/components/admin/modules/services/ServiceOptionsTable";

export default function AdminServicesPage() {
  return (
    <AdminRoute
      eyebrow="Catalogue"
      title="Service catalogue"
      description="The controlled list of services companions can tick on their profiles."
      requiredCapability="services.edit"
    >
      <ServiceOptionsTable />
    </AdminRoute>
  );
}
