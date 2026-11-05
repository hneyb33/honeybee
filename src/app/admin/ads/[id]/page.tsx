"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminRoute } from "@/components/admin/ui/AdminRoute";
import { Button } from "@/components/ui/button";
import { AdminAdDialog } from "@/components/admin/AdminAdDialog";
import { fetchAdById, type AdminAdRow } from "@/lib/admin/queries";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

/**
 * Deep edit view for a single campaign. The heavy lifting stays in the
 * proven `AdminAdDialog` (full form + media manager); this route simply
 * resolves the id and mounts the dialog in "always open" mode, so the URL
 * is shareable and the browser back button returns to the ads list.
 */
export default function AdminAdDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role, ready } = useAdminSession();
  const [row, setRow] = useState<AdminAdRow | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params?.id ?? "";

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    setLoading(true);
    void fetchAdById(id).then((result) => {
      if (!cancelled) {
        setRow(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, id]);

  const canEdit = can(role, "ads.edit") || can(role, "ads.moderate");

  return (
    <AdminRoute
      eyebrow="Advertising"
      title={row?.title ?? "Ad detail"}
      description={row ? `${row.ad_type} · ${row.status} · payment ${row.payment_status}` : undefined}
      actions={
        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl">
          <Link href="/admin/ads">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to ads
          </Link>
        </Button>
      }
    >
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900">
          Loading campaign…
        </p>
      ) : !row ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900">
          This ad does not exist or was deleted.
        </p>
      ) : !canEdit ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900">
          Your role cannot edit campaigns.
        </p>
      ) : (
        <AdminAdDialog
          open
          ad={{ id: row.id, title: row.title, ad_type: row.ad_type, status: row.status }}
          onOpenChange={(open) => {
            if (!open) router.push("/admin/ads");
          }}
          onSaved={() => void fetchAdById(id).then(setRow)}
        />
      )}
    </AdminRoute>
  );
}
