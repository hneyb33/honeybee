"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null;
  width?: string;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

/**
 * Generic data table with column-config, client-side sort, optional row
 * multi-select for bulk actions, and page controls. Rows arrive already
 * paginated from the query layer; the `page` and `totalPages` props drive
 * the pager only.
 */
export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  emptyLabel = "No records match the current filters.",
  page = 1,
  pageSize = 50,
  total = 0,
  onPageChange,
  selectable = false,
  bulkActions,
  rowActions,
  onRowClick,
  initialSortKey,
  initialSortDir = "desc",
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  emptyLabel?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (next: number) => void;
  selectable?: boolean;
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
}) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = rows.slice();
    copy.sort((a, b) => {
      const av = col.sortValue!(a) ?? "";
      const bv = col.sortValue!(b) ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  const allSelected = sorted.length > 0 && sorted.every((row) => selected.has(row.id));

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(sorted.map((row) => row.id));
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showPager = onPageChange && total > pageSize;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {selectable && selected.size > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-800/60">
          <span className="font-semibold">{selected.size} selected</span>
          {bulkActions(Array.from(selected), () => setSelected(new Set()))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-neutral-800">
          <thead className="bg-slate-50 dark:bg-neutral-800/60">
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300"
                    aria-label="Select all"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronDown className="h-3 w-3 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-[120px] px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading records…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-destructive">
                  {error}
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-6 w-6 opacity-40" />
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer",
                    selected.has(row.id)
                      ? "bg-[#5b82ff]/5 dark:bg-[#5b82ff]/10"
                      : "hover:bg-slate-50 dark:hover:bg-neutral-800/60",
                  )}
                >
                  {selectable ? (
                    <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.hideOnMobile && "hidden sm:table-cell",
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {rowActions ? <td className="px-4 py-3 text-right">{rowActions(row)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPager ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-muted-foreground dark:border-neutral-800">
          <p>
            Page {page} of {totalPages} · {total.toLocaleString()} records
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="h-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="h-8 rounded-lg"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
