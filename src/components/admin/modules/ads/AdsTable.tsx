"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminFilterBar, type FilterField } from "@/components/admin/ui/AdminFilterBar";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adsMutations, flagsMutations, runBulk } from "@/lib/admin/mutations";
import { fetchAds, type AdminAdRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";
import { getMediaImageUrl } from "@/lib/media-urls";
import { AdminAdDialog } from "@/components/admin/AdminAdDialog";
import { formatUGX } from "@/lib/utils";

const FILTER_FIELDS: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "pending", label: "Pending" },
      { value: "published", label: "Published" },
      { value: "rejected", label: "Rejected" },
      { value: "expired", label: "Expired" },
    ],
  },
  {
    key: "paymentStatus",
    label: "Payment",
    type: "select",
    options: [
      { value: "unpaid", label: "Unpaid" },
      { value: "submitted", label: "Submitted" },
      { value: "verified", label: "Verified" },
      { value: "rejected", label: "Rejected" },
    ],
  },
];

export function AdsTable() {
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "25" });
  const { role } = useAdminSession();
  const filters = useMemo<ListFilters>(
    () => ({
      q: values.q,
      status: values.status,
      paymentStatus: values.paymentStatus,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "25"),
    }),
    [values],
  );

  const [rows, setRows] = useState<AdminAdRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdminAdRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAds(filters);
    setRows(result.rows as AdminAdRow[]);
    setTotal(result.count);
    setError(result.error);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const run = async (id: string, action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setBusyId(id);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Action failed.");
    else {
      setError(null);
      flash("Saved.");
      await load();
    }
    setBusyId(null);
  };

  const feature = (ad: AdminAdRow) => {
    const tier = window.prompt("Featured tier: premium or vip", ad.featured_tier ?? "premium");
    if (tier !== "premium" && tier !== "vip") return;
    const until = window.prompt("Placement end date (YYYY-MM-DD)", ad.ends_at?.slice(0, 10) ?? "");
    if (!until || Number.isNaN(Date.parse(`${until}T23:59:59Z`))) {
      setError("Enter a valid placement end date.");
      return;
    }
    return run(ad.id, () =>
      adsMutations.setPlacement({
        adId: ad.id,
        featured: true,
        tier: tier as "premium" | "vip",
        endsAt: `${until}T23:59:59Z`,
      }),
    );
  };

  const unfeature = (ad: AdminAdRow) =>
    run(ad.id, () => adsMutations.setPlacement({ adId: ad.id, featured: false }));

  const settlePayment = (ad: AdminAdRow) => {
    const status = window.prompt(
      "Settlement status (unpaid / submitted / verified / rejected). Current: " + ad.payment_status,
      ad.payment_status,
    );
    if (!status) return;
    if (!["unpaid", "submitted", "verified", "rejected"].includes(status)) {
      setError("Choose a valid payment status.");
      return;
    }
    return run(ad.id, () => adsMutations.settlePayment(ad.id, status, null));
  };

  const flagAd = (ad: AdminAdRow) => {
    const reason = window.prompt("Reason for flagging this ad?");
    if (!reason || reason.length < 4) return;
    return run(ad.id, () =>
      flagsMutations.raise({ entity: "ad", entityId: ad.id, kind: "review", reason }),
    );
  };

  const columns: Column<AdminAdRow>[] = [
    {
      key: "title",
      header: "Ad",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-neutral-800">
            {row.cover_image ? (
              <Image
                src={getMediaImageUrl({ url: row.cover_image }, "card") || row.cover_image}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <Link
              href={`/ad/${row.slug}`}
              target="_blank"
              className="block truncate text-sm font-semibold hover:underline"
            >
              {row.title}
            </Link>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.ad_type} · {row.city ?? "—"} ·{" "}
              {row.profiles && !Array.isArray(row.profiles) ? row.profiles.name : "Owner?"}
            </p>
          </div>
        </div>
      ),
      sortValue: (row) => row.title.toLowerCase(),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <AdminStatusBadge status={row.status} />,
      sortValue: (row) => row.status,
      hideOnMobile: true,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => (
        <div className="text-xs">
          <AdminStatusBadge status={row.payment_status} />
          <p className="mt-1 text-muted-foreground">{formatUGX(row.amount)}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "placement",
      header: "Window",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <p>{new Date(row.starts_at).toLocaleDateString()}</p>
          <p>{row.ends_at ? `→ ${new Date(row.ends_at).toLocaleDateString()}` : "→ ongoing"}</p>
          {row.is_featured ? (
            <span className="mt-1 inline-flex items-center gap-1 text-amber-600">
              <Star className="h-3 w-3" /> {row.featured_tier}
            </span>
          ) : null}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
      sortValue: (row) => row.created_at,
      hideOnMobile: true,
    },
  ];

  return (
    <>
      <AdminFilterBar
        values={values}
        fields={FILTER_FIELDS}
        searchPlaceholder="Search by title…"
        onCommit={(patch) => commit(patch)}
        onReset={reset}
        rightSlot={
          <>
            <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
              <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-xl"
              onClick={() => {
                setSelectedAd(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-3 w-3" /> New ad
            </Button>
          </>
        }
      />

      {toast ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {toast}
        </div>
      ) : null}

      <AdminDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={filters.page ?? 1}
        pageSize={filters.pageSize ?? 25}
        total={total}
        onPageChange={(next) => commit({ page: String(next) })}
        selectable
        bulkActions={(ids, clear) => {
          if (!can(role, "ads.moderate")) return null;
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-emerald-600"
                disabled={busyId !== null}
                onClick={async () => {
                  const res = await runBulk(ids, (id) => adsMutations.publish(id));
                  flash(`${res.succeeded.length} published · ${res.failed.length} failed`);
                  clear();
                  await load();
                }}
              >
                <Check className="mr-1 h-3 w-3" /> Publish selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-destructive"
                disabled={busyId !== null}
                onClick={async () => {
                  const notes = window.prompt("Reason for bulk rejection?") ?? "Bulk rejection";
                  const res = await runBulk(ids, (id) => adsMutations.reject(id, notes));
                  flash(`${res.succeeded.length} rejected · ${res.failed.length} failed`);
                  clear();
                  await load();
                }}
              >
                <X className="mr-1 h-3 w-3" /> Reject selected
              </Button>
            </>
          );
        }}
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg" disabled={busyId === row.id}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              {can(role, "ads.moderate") ? (
                <>
                  <DropdownMenuItem onSelect={() => void run(row.id, () => adsMutations.publish(row.id))}>
                    <Check className="mr-2 h-4 w-4 text-emerald-600" /> Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      const notes = window.prompt("Reason for rejecting (saved for owner)?") ?? null;
                      void run(row.id, () => adsMutations.reject(row.id, notes));
                    }}
                  >
                    <X className="mr-2 h-4 w-4 text-destructive" /> Reject
                  </DropdownMenuItem>
                </>
              ) : null}
              {can(role, "ads.feature") ? (
                <DropdownMenuItem
                  onSelect={() => void (row.is_featured ? unfeature(row) : feature(row))}
                >
                  <Star className="mr-2 h-4 w-4 text-amber-500" />
                  {row.is_featured ? "Unfeature" : "Feature…"}
                </DropdownMenuItem>
              ) : null}
              {can(role, "ads.edit") ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void settlePayment(row)}>
                    <Settings2 className="mr-2 h-4 w-4" /> Settle payment…
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedAd(row);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Edit ad…
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void flagAd(row)}>
                Flag for review…
              </DropdownMenuItem>
              {can(role, "ads.delete") ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    if (!window.confirm(`Delete "${row.title}" permanently?`)) return;
                    void run(row.id, () => adsMutations.remove(row.id));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        emptyLabel="No ads match the current filters."
      />

      <AdminAdDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ad={selectedAd ? { id: selectedAd.id, title: selectedAd.title, ad_type: selectedAd.ad_type, status: selectedAd.status } : null}
        onSaved={() => void load()}
      />
    </>
  );
}
