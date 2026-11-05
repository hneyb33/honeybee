"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMediaDiagnostics } from "@/components/admin/AdminMediaDiagnostics";

export default function AdminMediaPage() {
  return (
    <AdminRoute
      eyebrow="Platform"
      title="Media pipeline"
      description="Diagnostics for R2 originals, processed variants and the Cloudflare queue consumer."
      requiredCapability="media.diagnose"
    >
      <AdminCard>
        <AdminMediaDiagnostics />
      </AdminCard>
    </AdminRoute>
  );
}
