"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, MoreHorizontal, RefreshCw, Trash2, X } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { paymentsMutations } from "@/lib/admin/mutations";
import { fetchPayments, type AdminPaymentRow, type ListFilters } from "@/lib/admin/queries";
import { useUrlFilters } from "@/lib/admin/use-url-filters";
import { useAdminSession } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";
import { formatUGX } from "@/lib/utils";

const FILTER_FIELDS: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "submitted", label: "Submitted" },
      { value: "verified", label: "Verified" },
      { value: "rejected", label: "Rejected" },
      { value: "pending", label: "Pending" },
    ],
  },
];

function flatten<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function PaymentsTable() {
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

  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchPayments(filters);
    setRows(result.rows as AdminPaymentRow[]);
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

  const review = (payment: AdminPaymentRow, action: "verify" | "reject") => {
    if (action === "reject") {
      const reason = window.prompt("Reason for rejecting this payment (at least 8 characters):");
      if (!reason || reason.length < 8) {
        setError("Enter a rejection reason of at least 8 characters.");
        return;
      }
      return run(payment.id, () => paymentsMutations.review(payment.id, "reject", reason));
    }
    return run(payment.id, () => paymentsMutations.review(payment.id, "verify", null));
  };

  const columns: Column<AdminPaymentRow>[] = [
    {
      key: "who",
      header: "Payer",
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
      cell: (row) => {
        const listing = flatten(row.listings);
        const ad = flatten(row.ads);
        return (
          <div className="text-xs">
            <p className="font-semibold capitalize">{row.plan} · {row.period}</p>
            {listing ? (
              <p className="mt-0.5 text-[11px] font-semibold text-[#c63843]">Listing: {listing.title}</p>
            ) : null}
            {ad ? <p className="mt-0.5 text-[11px] font-semibold text-[#c63843]">Ad: {ad.title}</p> : null}
          </div>
        );
      },
    },
    {
      key: "provider",
      header: "Method",
      cell: (row) => (
        <div className="text-xs">
          <p className="capitalize">{row.provider.replace(/_/g, " ")}</p>
          <p className="text-[11px] text-muted-foreground">
            {row.transaction_id ?? row.merchant_code ?? "—"}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <div className="text-right">
          <p className="text-sm font-extrabold text-[#c63843]">{formatUGX(row.amount)}</p>
          <AdminStatusBadge status={row.status} />
        </div>
      ),
      align: "right",
      sortValue: (row) => row.amount,
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "—"}
        </span>
      ),
      sortValue: (row) => row.submitted_at ?? row.created_at,
      hideOnMobile: true,
    },
  ];

  return (
    <>
      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AdminFilterBar
        values={values}
        fields={FILTER_FIELDS}
        searchPlaceholder="Search by transaction id / phone / merchant…"
        onCommit={commit}
        onReset={reset}
        rightSlot={
          <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        }
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
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg" disabled={busyId === row.id}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              {row.proof_url ? (
                <DropdownMenuItem asChild>
                  <a href={row.proof_url} target="_blank" rel="noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> View proof
                  </a>
                </DropdownMenuItem>
              ) : null}
              {can(role, "payments.review") && row.status === "submitted" ? (
                <>
                  <DropdownMenuItem onSelect={() => void review(row, "verify")}>
                    <Check className="mr-2 h-4 w-4 text-emerald-600" /> Verify
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void review(row, "reject")}>
                    <X className="mr-2 h-4 w-4 text-destructive" /> Reject…
                  </DropdownMenuItem>
                </>
              ) : null}
              {can(role, "payments.delete") && row.status !== "verified" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => {
                      if (!window.confirm("Delete this payment record?")) return;
                      void run(row.id, () => paymentsMutations.remove(row.id));
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        emptyLabel="No payments match the current filters."
      />
    </>
  );
}

export function PaymentReviewQueue() {
  const { role } = useAdminSession();
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchPayments({ status: "submitted", pageSize: 50 });
    setRows(result.rows as AdminPaymentRow[]);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    payment: AdminPaymentRow,
    action: "verify" | "reject",
  ) => {
    let reason: string | null = null;
    if (action === "reject") {
      const entered = window.prompt("Reason for rejecting this payment (min 8 characters):");
      if (entered === null) return;
      reason = entered.trim();
      if (reason.length < 8) {
        setError("Enter a rejection reason of at least 8 characters.");
        return;
      }
    }
    setBusyId(payment.id);
    const result = await paymentsMutations.review(payment.id, action, reason);
    if (!result.ok) setError(result.error ?? "Review failed.");
    else await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? (
        <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Loading payment queue…
        </Card>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No submitted payments are waiting for review.
        </Card>
      ) : (
        rows.map((payment) => {
          const profile = flatten(payment.profiles);
          const listing = flatten(payment.listings);
          return (
            <Card key={payment.id} className="rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h2 className="font-bold">{profile?.name ?? profile?.email ?? "Account"}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payment.plan} · {payment.period} · {payment.provider.replaceAll("_", " ")}
                  </p>
                  {listing?.title ? (
                    <p className="mt-1 text-xs font-semibold text-[#c63843]">Ad feature: {listing.title}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Phone: {payment.payer_phone ?? "—"} · Txn: {payment.transaction_id ?? "—"} ·{" "}
                    Merchant: {payment.merchant_code ?? "—"}
                  </p>
                  {payment.proof_url ? (
                    <a
                      href={payment.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[#5b82ff] hover:underline"
                    >
                      View payment proof
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <strong className="mr-2 text-lg font-extrabold text-[#c63843]">
                    {formatUGX(payment.amount)}
                  </strong>
                  {can(role, "payments.review") ? (
                    <>
                      <Button
                        size="sm"
                        disabled={busyId === payment.id}
                        onClick={() => void act(payment, "verify")}
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="mr-1 h-4 w-4" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === payment.id}
                        onClick={() => void act(payment, "reject")}
                        className="rounded-xl text-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
