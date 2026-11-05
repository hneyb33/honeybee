"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdTimeline } from "@/components/admin/modules/timeline/AdTimeline";

export default function AdminTimelinePage() {
  return (
    <AdminRoute
      eyebrow="Advertising"
      title="Ad timeline"
      description="Planning calendar for paid placements — click a bar to move its end date."
      requiredCapability="ads.moderate"
    >
      <AdTimeline />
    </AdminRoute>
  );
}
