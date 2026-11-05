"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminBillingSettings } from "@/components/admin/AdminBillingSettings";

export default function AdminBillingSettingsPage() {
  return (
    <AdminRoute
      eyebrow="Billing"
      title="Billing settings"
      description="Merchant codes and plan pricing used across the checkout and ad purchase flows."
      requiredCapability="billing.edit"
    >
      <AdminCard>
        <AdminBillingSettings />
      </AdminCard>
    </AdminRoute>
  );
}
