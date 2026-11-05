"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { categoryMutations } from "@/lib/admin/mutations";
import {
  fetchAdCategories,
  fetchListingCategories,
  type AdminCategoryBucket,
} from "@/lib/admin/queries";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

type CategoryTable = "listings" | "ads";

const FETCHERS: Record<CategoryTable, () => Promise<AdminCategoryBucket[]>> = {
  listings: async () => (await fetchListingCategories()).rows,
  ads: async () => (await fetchAdCategories()).rows,
};

/**
 * Editable view over the implicit category dictionaries. There is no
 * `categories` table: the dictionary is the set of distinct values already in
 * use, so "rename" rewrites every row and "remove" falls back to the safest
 * neutral value for that table.
 */
export function CategoriesTable({ table }: { table: CategoryTable }) {
  const { role } = useAdminSession();
  const editable = can(role, table === "ads" ? "ads.edit" : "listings.edit");

  const [rows, setRows] = useState<AdminCategoryBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await FETCHERS[table]());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (value: string, action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setBusy(value);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Action failed.");
    else await load();
    setBusy(null);
  };

  const columns = useMemo<Column<AdminCategoryBucket>[]>(
    () => [
      {
        key: "category",
        header: "Category",
        cell: (row) => <span className="font-medium capitalize">{row.category}</span>,
        sortValue: (row) => row.category.toLowerCase(),
      },
      {
        key: "count",
        header: "In use",
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.count.toLocaleString()} {row.count === 1 ? "row" : "rows"}
          </span>
        ),
        align: "right",
        sortValue: (row) => row.count,
      },
    ],
    [],
  );

  return (
    <AdminCard
      title={table === "ads" ? "Ad categories" : "Listing categories"}
      description="Renaming updates every row that uses the old value."
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <AdminDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={null}
        emptyLabel="No categories in use yet."
        rowActions={(row) =>
          editable ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg"
                disabled={busy === row.category}
                onClick={() => {
                  const next = window.prompt(`Rename "${row.category}" to`, row.category);
                  if (!next || next.trim() === row.category) return;
                  void run(row.category, () => categoryMutations.rename(table, row.category, next));
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-destructive"
                disabled={busy === row.category}
                onClick={() => {
                  const fallback = table === "ads" ? "unset" : "'other'";
                  if (
                    !window.confirm(
                      `Remove "${row.category}"? ${row.count} row(s) will fall back to ${fallback}.`,
                    )
                  )
                    return;
                  void run(row.category, () => categoryMutations.remove(table, row.category));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null
        }
      />
    </AdminCard>
  );
}
