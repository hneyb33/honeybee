"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { serviceOptionsMutations } from "@/lib/admin/mutations";
import { fetchServiceOptions, type AdminServiceOptionRow } from "@/lib/admin/queries";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

export function ServiceOptionsTable() {
  const { role } = useAdminSession();
  const [rows, setRows] = useState<AdminServiceOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const editable = can(role, "services.edit");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchServiceOptions();
    setRows(result.rows);
    setError(result.error);
    setLoading(false);
  }, []);

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
    const name = window.prompt("Service option label?");
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const sort = rows.length + 1;
    await run(slug || Date.now().toString(), () =>
      serviceOptionsMutations.create({ id: slug || `svc-${Date.now()}`, name, sort_order: sort, is_active: true }),
    );
  };

  return (
    <AdminCard
      title="Escort service catalogue"
      description="Options selectable when a model creates a listing. Toggling off hides them for new listings."
      actions={
        editable ? (
          <Button size="sm" className="h-9 rounded-xl" onClick={() => void create()}>
            <Plus className="mr-1 h-3 w-3" /> Add option
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        )
      }
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading catalogue…</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No options configured.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-neutral-800">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground dark:bg-neutral-800/60">
              <tr>
                <th className="px-3 py-2 text-left">Sort</th>
                <th className="px-3 py-2 text-left">Label</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Active</th>
                {editable ? <th className="px-3 py-2 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/60">
                  <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">{row.sort_order}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{row.id}</td>
                  <td className="px-3 py-2">
                    <AdminStatusBadge status={row.is_active ? "active" : "expired"} label={row.is_active ? "Active" : "Hidden"} />
                  </td>
                  {editable ? (
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg"
                        disabled={busy === row.id}
                        onClick={() => {
                          const next = window.prompt("Rename option", row.name);
                          if (!next || next === row.name) return;
                          void run(row.id, () => serviceOptionsMutations.update(row.id, { name: next }));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg"
                        disabled={busy === row.id}
                        onClick={() =>
                          void run(row.id, () =>
                            serviceOptionsMutations.update(row.id, { is_active: !row.is_active }),
                          )
                        }
                      >
                        {row.is_active ? "Hide" : "Show"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-destructive"
                        disabled={busy === row.id}
                        onClick={() => {
                          if (!window.confirm(`Delete "${row.name}"?`)) return;
                          void run(row.id, () => serviceOptionsMutations.remove(row.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
