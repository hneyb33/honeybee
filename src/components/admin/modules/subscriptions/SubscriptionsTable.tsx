"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminFilterBar, type FilterField } from "@/components/admin/ui/AdminFilterBar";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { subscriptionsMutations } from "@/lib/admin/mutations";
import { fetchSubscriptions, type AdminSubscriptionRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

function flatten<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const FILTER_FIELDS: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "expired", label: "Expired" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
];

export function SubscriptionsTable() {
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "25" });
  const { role } = useAdminSession();

  const filters = useMemo<ListFilters>(
    () => ({
      q: values.q,
      status: values.status,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "25"),
    }),
    [values],
  );

  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchSubscriptions(filters);
    setRows(result.rows as AdminSubscriptionRow[]);
    setTotal(result.count);
    setError(result.error);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id: string, action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setBusyId(id);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Action failed.");
    else await load();
    setBusyId(null);
  };

  const columns: Column<AdminSubscriptionRow>[] = [
    {
      key: "user",
      header: "Subscriber",
      cell: (row) => {
        const profile = flatten(row.profiles);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.name ?? "Account"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{profile?.email ?? "—"}</p>
          </div>
        );
      },
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold">{row.plan}</p>
          <p className="text-muted-foreground capitalize">{row.period}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "window",
      header: "Window",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <p>{new Date(row.starts_at).toLocaleDateString()}</p>
          <p>{row.ends_at ? `→ ${new Date(row.ends_at).toLocaleDateString()}` : "→ ongoing"}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
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
        searchPlaceholder="Search by plan / user…"
        onCommit={commit}
        onReset={reset}
        rightSlot={
          <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
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
        rowActions={(row) =>
          can(role, "subscriptions.edit") ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg" disabled={busyId === row.id}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                  onSelect={() => void run(row.id, () => subscriptionsMutations.setStatus(row.id, "active"))}
                >
                  Mark active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void run(row.id, () => subscriptionsMutations.setStatus(row.id, "expired"))}
                >
                  Mark expired
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void run(row.id, () => subscriptionsMutations.setStatus(row.id, "cancelled"))}
                >
                  Cancel
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    if (!window.confirm("Delete this subscription record?")) return;
                    void run(row.id, () => subscriptionsMutations.remove(row.id));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
        emptyLabel="No subscriptions found."
      />
    </>
  );
}
