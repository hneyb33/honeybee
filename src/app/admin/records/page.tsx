"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { PaymentsTable } from "@/components/admin/modules/payments/PaymentsTable";

export default function AdminRecordsPage() {
  return (
    <AdminRoute
      eyebrow="Billing"
      title="Payment records"
      description="Historical payment records — verified, rejected and pending — without the review queue."
      requiredCapability="payments.review"
    >
      <AdminCard title="Ledger" description="Filter by status or search a transaction id.">
        <PaymentsTable />
      </AdminCard>
    </AdminRoute>
  );
}
