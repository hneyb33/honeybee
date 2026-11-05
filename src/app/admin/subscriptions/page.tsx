"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { SubscriptionsTable } from "@/components/admin/modules/subscriptions/SubscriptionsTable";

export default function AdminSubscriptionsPage() {
  return (
    <AdminRoute
      eyebrow="Billing"
      title="Subscriptions"
      description="Active, expired and cancelled plans across every account kind."
    >
      <AdminCard title="Plans" description="Manually extend, cancel or remove subscriptions.">
        <SubscriptionsTable />
      </AdminCard>
    </AdminRoute>
  );
}
