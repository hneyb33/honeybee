"use client";

import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { AuditLogTable } from "@/components/admin/modules/audit/AuditLogTable";

export default function AdminAuditPage() {
  return (
    <AdminRoute
      eyebrow="Platform"
      title="Audit log"
      description="Immutable trail of every admin mutation, written by the database RPCs."
      requiredCapability="audit.read"
    >
      <AuditLogTable />
    </AdminRoute>
  );
}
