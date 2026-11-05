"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  RefreshCw,
  Shield,
  ShieldAlert,
  Star,
  Trash2,
  UserCog,
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
import { flagsMutations, usersMutations } from "@/lib/admin/mutations";
import { fetchUsers, type AdminUserRow } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";

const ROLE_OPTIONS = [
  "client_free",
  "client_premium",
  "provider_free",
  "provider_premium",
  "moderator",
  "super_admin",
];

const ALL_FIELDS: FilterField[] = [
  {
    key: "accountKind",
    label: "Kind",
    type: "select",
    options: [
      { value: "client", label: "Client" },
      { value: "model", label: "Model" },
      { value: "specialist", label: "Specialist" },
      { value: "agency", label: "Agency" },
      { value: "admin", label: "Admin" },
    ],
  },
  {
    key: "role",
    label: "Role",
    type: "select",
    options: ROLE_OPTIONS.map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
  },
];

const CLIENT_FIELDS: FilterField[] = [
  {
    key: "role",
    label: "Role",
    type: "select",
    options: [
      { value: "client_free", label: "Free" },
      { value: "client_premium", label: "Premium" },
    ],
  },
];

const ADMIN_FIELDS: FilterField[] = [
  {
    key: "userRole",
    label: "Admin tier",
    type: "select",
    options: [
      { value: "moderator", label: "Moderator" },
      { value: "super_admin", label: "Super admin" },
    ],
  },
];

/**
 * Users table with three variants:
 * - `all` → default admin directory (everyone)
 * - `clients` → account_kind=client only (lighter filter set)
 * - `admins` → moderators + super_admins (drives /admin/roles)
 */
export function UsersTable({ variant = "all" }: { variant?: "all" | "clients" | "admins" }) {
  const { values, commit, reset } = useUrlFilters({ page: "1", pageSize: "25" });
  const { role, profile } = useAdminSession();

  const filters = useMemo(
    () => ({
      q: values.q,
      page: Number(values.page ?? "1"),
      pageSize: Number(values.pageSize ?? "25"),
      accountKind: variant === "clients" ? "client" : values.accountKind,
      status: variant === "admins" ? undefined : values.role,
      userRole: variant === "admins" ? ((values.userRole as "moderator" | "super_admin") ?? "any") : undefined,
    }),
    [values, variant],
  );

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchUsers(filters);
    setRows(result.rows as AdminUserRow[]);
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

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
            {row.avatar_url ? (
              <Image src={row.avatar_url} alt="" fill unoptimized className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{row.email ?? row.phone ?? "—"}</p>
          </div>
        </div>
      ),
      sortValue: (row) => row.name.toLowerCase(),
    },
    {
      key: "kind",
      header: "Kind",
      cell: (row) => <AdminStatusBadge status={row.account_kind} />,
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <AdminStatusBadge status={row.role} />,
      hideOnMobile: true,
    },
    {
      key: "advertiser",
      header: "Advertiser",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.advertiser_type ?? "—"}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "created",
      header: "Joined",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
      sortValue: (row) => row.created_at,
      hideOnMobile: true,
    },
  ];

  const fields = variant === "clients" ? CLIENT_FIELDS : variant === "admins" ? ADMIN_FIELDS : ALL_FIELDS;

  return (
    <>
      <AdminFilterBar
        values={values}
        fields={fields}
        searchPlaceholder="Search name / email / phone…"
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
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg" disabled={busyId === row.id}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              {can(role, "users.edit") ? (
                <DropdownMenuItem
                  onSelect={() => {
                    const name = window.prompt("User name", row.name);
                    if (name === null) return;
                    const phone = window.prompt("Phone (leave blank to clear)", row.phone ?? "");
                    if (phone === null) return;
                    const accountKind = window.prompt(
                      "Account kind: client, specialist, model, agency",
                      row.account_kind,
                    );
                    if (accountKind === null) return;
                    void run(row.id, () =>
                      usersMutations.updateProfile({
                        userId: row.id,
                        name: name.trim(),
                        phone: phone.trim() || null,
                        accountKind: accountKind.trim(),
                      }),
                    );
                  }}
                >
                  <UserCog className="mr-2 h-4 w-4" /> Edit profile…
                </DropdownMenuItem>
              ) : null}
              {can(role, "users.roleChange") && row.id !== profile?.id ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabelRole />
                  {ROLE_OPTIONS.map((next) =>
                    row.role === next ? null : (
                      <DropdownMenuItem
                        key={next}
                        onSelect={() => void run(row.id, () => usersMutations.setRole(row.id, next))}
                        className={next === "super_admin" ? "text-rose-600" : undefined}
                      >
                        {next === "moderator" ? (
                          <Shield className="mr-2 h-4 w-4 text-sky-600" />
                        ) : next === "super_admin" ? (
                          <ShieldAlert className="mr-2 h-4 w-4" />
                        ) : next === "client_premium" || next === "provider_premium" ? (
                          <Star className="mr-2 h-4 w-4 text-amber-500" />
                        ) : (
                          <span className="mr-2 inline-block h-4 w-4" />
                        )}
                        Set {next.replace(/_/g, " ")}
                      </DropdownMenuItem>
                    ),
                  )}
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  const reason = window.prompt("Flag reason for this user?");
                  if (!reason || reason.length < 4) return;
                  void run(row.id, () =>
                    flagsMutations.raise({ entity: "profile", entityId: row.id, kind: "review", reason }),
                  );
                }}
              >
                Flag for review…
              </DropdownMenuItem>
              {can(role, "users.delete") && row.id !== profile?.id ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    if (!window.confirm(`Permanently delete ${row.name}?`)) return;
                    void run(row.id, () => usersMutations.remove(row.id));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete user
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        emptyLabel="No users match the current filters."
      />
    </>
  );
}

function DropdownMenuLabelRole() {
  return (
    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      Change role
    </div>
  );
}
