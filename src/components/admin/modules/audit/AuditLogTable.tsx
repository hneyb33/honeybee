"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminFilterBar, type FilterField } from "@/components/admin/ui/AdminFilterBar";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { fetchAuditLog, type AdminAuditRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";

const ENTITY_OPTIONS = [
  "ad",
  "listing",
  "profile",
  "payment",
  "subscription",
  "flag",
  "billing",
  "site",
];

const FILTER_FIELDS: FilterField[] = [
  {
    key: "entity",
    label: "Entity",
    type: "select",
    options: ENTITY_OPTIONS.map((value) => ({ value, label: value })),
  },
];

/** Deep link for the mutated entity where the admin UI has a surface for it. */
const ENTITY_LINKS: Record<string, (id: string) => string> = {
  ad: (id) => `/admin/ads/${id}`,
  listing: () => "/admin/listings",
  profile: () => "/admin/users",
  payment: () => "/admin/payments",
};

export function AuditLogTable() {
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "25" });
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = useMemo<ListFilters & { entity?: string }>(
    () => ({
      q: values.q,
      entity: values.entity,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "25"),
    }),
    [values],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAuditLog(filters);
    setRows(result.rows as AdminAuditRow[]);
    setTotal(result.count);
    setError(result.error);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<AdminAuditRow>[] = [
    {
      key: "created",
      header: "When",
      cell: (row) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
      sortValue: (row) => row.created_at,
    },
    {
      key: "actor",
      header: "Actor",
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold">{row.actor?.name ?? "System"}</p>
          <p className="text-muted-foreground">{row.actor_role ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-neutral-800">
          {row.action}
        </code>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      cell: (row) => {
        const link = row.entity_id ? ENTITY_LINKS[row.entity]?.(row.entity_id) : null;
        return (
          <div className="text-xs">
            <p className="capitalize font-medium">{row.entity}</p>
            {row.entity_id ? (
              <p className="font-mono text-[10px] text-muted-foreground">
                {row.entity_id.slice(0, 8)}
              </p>
            ) : null}
            {link ? (
              <Link
                href={link}
                className="text-[11px] font-semibold text-[#5b82ff] hover:underline"
              >
                open
              </Link>
            ) : null}
          </div>
        );
      },
      hideOnMobile: true,
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <span className="line-clamp-2 text-xs text-muted-foreground">{row.reason ?? "—"}</span>
      ),
    },
    {
      key: "diff",
      header: "",
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-lg text-[11px]"
          onClick={(event) => {
            event.stopPropagation();
            setExpandedId((current) => (current === row.id ? null : row.id));
          }}
        >
          {expandedId === row.id ? (
            <>
              <ChevronDown className="mr-1 h-3 w-3" /> Hide diff
            </>
          ) : (
            <>
              <ChevronRight className="mr-1 h-3 w-3" /> Diff
            </>
          )}
        </Button>
      ),
      align: "right",
    },
  ];

  return (
    <AdminCard
      title="Audit log"
      description="Every admin mutation, appended by the database RPCs. Immutable."
      actions={
        <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      }
    >
      <AdminFilterBar
        values={values}
        fields={FILTER_FIELDS}
        searchPlaceholder="Search action / reason…"
        onCommit={commit}
        onReset={reset}
      />
      {expandedId ? (
        <DiffPanel row={rows.find((candidate) => candidate.id === expandedId) ?? null} />
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
        onRowClick={(row) => setExpandedId((current) => (current === row.id ? null : row.id))}
        emptyLabel="No admin activity recorded yet."
      />
    </AdminCard>
  );
}

function DiffPanel({ row }: { row: AdminAuditRow | null }) {
  if (!row) return null;
  return (
    <div className="mb-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] dark:border-neutral-800 dark:bg-neutral-800/60 sm:grid-cols-2">
      <DiffSide label="Before" value={row.before} />
      <DiffSide label="After" value={row.after} />
    </div>
  );
}

function DiffSide({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="mb-1 font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-white p-2 dark:bg-neutral-900">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
