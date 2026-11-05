"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/ui/AdminDataTable";
import { AdminFilterBar } from "@/components/admin/ui/AdminFilterBar";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { placesMutations } from "@/lib/admin/mutations";
import { fetchPlaces, type AdminPlaceRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

export function ProviderLocationsTable() {
  const { role } = useAdminSession();
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "50" });
  const editable = can(role, "domains.edit");

  const filters = useMemo<ListFilters>(
    () => ({
      q: values.q,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "50"),
    }),
    [values],
  );

  const [rows, setRows] = useState<AdminPlaceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchPlaces(filters);
    setRows(result.rows);
    setTotal(result.count);
    setError(result.error);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id: string, action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setBusy(id);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Action failed.");
    else await load();
    setBusy(null);
  };

  const create = async () => {
    const name = window.prompt("Display name");
    if (!name) return;
    const area = window.prompt("Area / neighborhood", name);
    if (!area) return;
    const city = window.prompt("City", "Kampala");
    if (!city) return;
    const lat = Number(window.prompt("Latitude", "0.347596") ?? 0);
    const lng = Number(window.prompt("Longitude", "32.582520") ?? 0);
    await run(`new-${Date.now()}`, () =>
      placesMutations.create({ name, area, city, latitude: lat || 0, longitude: lng || 0 }),
    );
  };

  const columns: Column<AdminPlaceRow>[] = [
    { key: "name", header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "area", header: "Area", cell: (row) => row.area },
    { key: "city", header: "City", cell: (row) => row.city },
    {
      key: "coords",
      header: "Coordinates",
      cell: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <AdminCard
      title="Provider locations"
      description="Areas and cities auto-populated from listings. Fix typos or dedupe entries here."
      actions={
        editable ? (
          <Button size="sm" className="h-9 rounded-xl" onClick={() => void create()}>
            <Plus className="mr-1 h-3 w-3" /> Add location
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        )
      }
    >
      <AdminFilterBar
        values={values}
        fields={[]}
        searchPlaceholder="Search places…"
        onCommit={commit}
        onReset={reset}
      />
      <AdminDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={filters.page ?? 1}
        pageSize={filters.pageSize ?? 50}
        total={total}
        onPageChange={(next) => commit({ page: String(next) })}
        rowActions={(row) =>
          editable ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg"
                disabled={busy === row.id}
                onClick={() => {
                  const next = window.prompt("Rename area", row.area);
                  if (!next || next === row.area) return;
                  void run(row.id, () => placesMutations.update(row.id, { area: next, name: next }));
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-destructive"
                disabled={busy === row.id}
                onClick={() => {
                  if (!window.confirm(`Delete ${row.area}, ${row.city}?`)) return;
                  void run(row.id, () => placesMutations.remove(row.id));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null
        }
        emptyLabel="No locations captured yet."
      />
    </AdminCard>
  );
}
