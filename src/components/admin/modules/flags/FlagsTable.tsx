"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminFilterBar, type FilterField } from "@/components/admin/ui/AdminFilterBar";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { flagsMutations } from "@/lib/admin/mutations";
import { fetchFlags, type AdminFlagRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

const FILTER_FIELDS: FilterField[] = [
  {
    key: "entity",
    label: "Entity",
    type: "select",
    options: [
      { value: "profile", label: "Profile" },
      { value: "listing", label: "Listing" },
      { value: "ad", label: "Ad" },
      { value: "payment", label: "Payment" },
    ],
  },
  {
    key: "state",
    label: "State",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "resolved", label: "Resolved" },
    ],
  },
];

const ENTITY_LINKS: Record<string, (id: string) => string> = {
  ad: (id) => `/admin/ads/${id}`,
  listing: () => "/admin/listings",
  profile: () => "/admin/users",
  payment: () => "/admin/payments",
};

export function FlagsTable() {
  const { role } = useAdminSession();
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "25" });
  const manageable = can(role, "flags.manage");

  const filters = useMemo<ListFilters & { includeResolved?: boolean }>(
    () => ({
      entity: values.entity,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "25"),
      includeResolved: values.state === "resolved",
    }),
    [values],
  );

  const [rows, setRows] = useState<AdminFlagRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchFlags(filters);
    setRows(result.rows as AdminFlagRow[]);
    setTotal(result.count);
    setError(result.error);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (flag: AdminFlagRow) => {
    const resolution = window.prompt("Resolution note (what happened / why this is closed)?");
    if (!resolution || resolution.trim().length < 4) return;
    setBusyId(flag.id);
    const result = await flagsMutations.resolve(flag.id, resolution.trim());
    if (!result.ok) setError(result.error ?? "Resolve failed.");
    else await load();
    setBusyId(null);
  };

  const columns: Column<AdminFlagRow>[] = [
    {
      key: "raised",
      header: "Raised",
      cell: (row) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Date(row.raised_at).toLocaleString()}
        </span>
      ),
      sortValue: (row) => row.raised_at,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (row) => {
        const link = ENTITY_LINKS[row.entity]?.(row.entity_id);
        return (
          <div className="text-xs">
            <p className="font-medium capitalize">{row.entity}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {row.entity_id.slice(0, 8)}
            </p>
            {link ? (
              <Link href={link} className="text-[11px] font-semibold text-[#5b82ff] hover:underline">
                open
              </Link>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "kind",
      header: "Kind",
      cell: (row) => <AdminStatusBadge status={row.kind} />,
      hideOnMobile: true,
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <div className="min-w-0 text-xs">
          <p className="line-clamp-2">{row.reason}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            by {row.raised_by?.name ?? "unknown"}
          </p>
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      cell: (row) =>
        row.resolved_at ? (
          <div className="text-xs">
            <AdminStatusBadge status="verified" label="resolved" />
            <p className="mt-1 line-clamp-2 text-muted-foreground">
              {row.resolution ?? "—"} · {row.resolved_by?.name ?? "system"}
            </p>
          </div>
        ) : (
          <AdminStatusBadge status="pending" label="open" />
        ),
      hideOnMobile: true,
    },
  ];

  return (
    <AdminCard
      title="Flags"
      description="Items the community or moderators raised for a second look."
      actions={
        <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      }
    >
      <AdminFilterBar
        values={values}
        fields={FILTER_FIELDS}
        searchPlaceholder="Search flags…"
        onCommit={commit}
        onReset={reset}
      />
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
          manageable && !row.resolved_at ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-emerald-600"
              disabled={busyId === row.id}
              onClick={() => void resolve(row)}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" /> Resolve…
            </Button>
          ) : null
        }
        emptyLabel="Nothing flagged. Nice."
      />
    </AdminCard>
  );
}
