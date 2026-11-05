"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdsTable } from "@/components/admin/modules/ads/AdsTable";

export default function AdminAdsPage() {
  return (
    <AdminRoute
      eyebrow="Advertising"
      title="Ads"
      description="Approve, reject, feature and re-time every campaign on the platform."
    >
      <AdsTable />
    </AdminRoute>
  );
}
