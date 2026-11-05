"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { PaymentReviewQueue, PaymentsTable } from "@/components/admin/modules/payments/PaymentsTable";

export default function AdminPaymentsPage() {
  return (
    <AdminRoute
      eyebrow="Billing"
      title="Payments"
      description="Mobile-money confirmations waiting for review, plus the full payment ledger."
      requiredCapability="payments.review"
    >
      <div className="space-y-6">
        <AdminCard
          title="Review queue"
          description="Submitted payments, oldest first. Verifying activates the plan or features the ad."
        >
          <PaymentReviewQueue />
        </AdminCard>
        <AdminCard title="All payments" description="Searchable ledger across every status.">
          <PaymentsTable />
        </AdminCard>
      </div>
    </AdminRoute>
  );
}
