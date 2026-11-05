"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { VerificationQueue } from "@/components/admin/modules/verifications/VerificationQueue";

export default function AdminVerificationsPage() {
  return (
    <AdminRoute
      eyebrow="Trust & safety"
      title="Profile verifications"
      description="Media-heavy review cards for profiles waiting in the moderation queue."
      requiredCapability="verifications.review"
    >
      <VerificationQueue />
    </AdminRoute>
  );
}
