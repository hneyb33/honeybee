"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUGX } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

const PLAN_OPTIONS = [
  { id: "client_premium", title: "Client VIP Access" },
  { id: "escort_vip", title: "VIP Models" },
  { id: "specialist", title: "Service Providers" },
  { id: "escort_premium", title: "Premium Model" },
  { id: "advertiser_premium", title: "Advertising" },
] as const;

const DEFAULT_PRICES: Record<(typeof PLAN_OPTIONS)[number]["id"], number> = {
  client_premium: 35_000,
  escort_vip: 80_000,
  specialist: 50_000,
  escort_premium: 50_000,
  advertiser_premium: 50_000,
};

type ProviderId = "mtn_momo" | "airtel_money";
type PlanId = keyof typeof DEFAULT_PRICES;

export function AdminBillingSettings() {
  const [merchantCodes, setMerchantCodes] = useState<Record<ProviderId, string>>({
    mtn_momo: "",
    airtel_money: "",
  });
  const [prices, setPrices] = useState<Record<PlanId, number>>(DEFAULT_PRICES);
  const [inactivePlans, setInactivePlans] = useState<Set<PlanId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"merchants" | "plans" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      setError("Configure Supabase and apply the admin billing settings migration first.");
      return;
    }
    let cancelled = false;

    const loadSettings = async () => {
      const [providersResult, pricesResult] = await Promise.all([
        client.from("payment_provider_settings").select("provider,merchant_code"),
        client.from("subscription_plan_prices").select("plan,amount,is_active"),
      ]);
      if (cancelled) return;
      const queryError = providersResult.error ?? pricesResult.error;
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }
      setMerchantCodes((current) => {
        const next = { ...current };
        for (const row of providersResult.data ?? []) {
          if (row.provider === "mtn_momo") next.mtn_momo = row.merchant_code;
          else if (row.provider === "airtel_money") next.airtel_money = row.merchant_code;
        }
        return next;
      });
      setPrices((current) => {
        const next = { ...current };
        for (const row of pricesResult.data ?? []) {
          if (row.plan in current) next[row.plan as PlanId] = row.amount;
        }
        return next;
      });
      setInactivePlans(new Set((pricesResult.data ?? [])
        .filter((row) => !row.is_active)
        .map((row) => row.plan as PlanId)));
      setError("");
      setLoading(false);
    };

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveMerchantCodes = async () => {
    const client = supabase;
    if (!client) return;
    const codes = Object.entries(merchantCodes) as [ProviderId, string][];
    if (codes.some(([, code]) => !code.trim() || code.trim().length > 80)) {
      setError("Enter a merchant code of 1–80 characters for each payment provider.");
      return;
    }
    setSaving("merchants");
    setError("");
    setNotice("");
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) {
      setError(authError?.message ?? "Sign in again before saving payment settings.");
      setSaving(null);
      return;
    }
    const { error: saveError } = await client.from("payment_provider_settings").upsert(
      codes.map(([provider, merchant_code]) => ({
        provider,
        merchant_code: merchant_code.trim(),
        updated_at: new Date().toISOString(),
        updated_by: authData.user.id,
      }))
    );
    if (saveError) setError(saveError.message);
    else setNotice("Payment merchant codes saved.");
    setSaving(null);
  };

  const savePlanPrices = async () => {
    const client = supabase;
    if (!client) return;
    if (PLAN_OPTIONS.some(({ id }) => !Number.isSafeInteger(prices[id]) || prices[id] < 1)) {
      setError("Subscription fees must be whole numbers greater than zero.");
      return;
    }
    setSaving("plans");
    setError("");
    setNotice("");
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) {
      setError(authError?.message ?? "Sign in again before saving subscription fees.");
      setSaving(null);
      return;
    }
    const now = new Date().toISOString();
    const { error: saveError } = await client.from("subscription_plan_prices").upsert(
      PLAN_OPTIONS.map(({ id }) => ({
        plan: id,
        amount: prices[id],
        currency: "UGX",
        is_active: !inactivePlans.has(id),
        updated_at: now,
        updated_by: authData.user.id,
      }))
    );
    if (saveError) setError(saveError.message);
    else setNotice("Subscription fees and availability saved.");
    setSaving(null);
  };

  if (loading) {
    return <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading billing settings...</p>;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-lg font-bold">Payments &amp; subscription fees</h2>
        <p className="mt-1 text-sm text-muted-foreground">Changes apply to new checkouts. Existing payment records keep their original amounts and merchant-code snapshots.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      <Card className="space-y-4 rounded-2xl p-4 sm:p-6">
        <div>
          <h3 className="font-semibold">Merchant codes</h3>
          <p className="mt-1 text-xs text-muted-foreground">These codes are shown to customers during checkout and saved with the payment.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            MTN MoMo merchant code
            <input value={merchantCodes.mtn_momo} maxLength={80} onChange={(event) => setMerchantCodes((current) => ({ ...current, mtn_momo: event.target.value }))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Airtel Money merchant code
            <input value={merchantCodes.airtel_money} maxLength={80} onChange={(event) => setMerchantCodes((current) => ({ ...current, airtel_money: event.target.value }))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={() => void saveMerchantCodes()} disabled={saving !== null || !supabase} className="rounded-xl">
            {saving === "merchants" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save merchant codes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 rounded-2xl p-4 sm:p-6">
        <div>
          <h3 className="font-semibold">Subscription fees</h3>
          <p className="mt-1 text-xs text-muted-foreground">Prices are in UGX per month. Inactive plans cannot be purchased.</p>
        </div>
        <div className="divide-y divide-border">
          {PLAN_OPTIONS.map(({ id, title }) => (
            <div key={id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center">
              <label htmlFor={`price-${id}`} className="text-sm font-medium">{title}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">UGX</span>
                <input id={`price-${id}`} type="number" min={1} step={1} value={prices[id]} onChange={(event) => setPrices((current) => ({ ...current, [id]: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-input bg-background pl-12 pr-3 text-sm" />
                <span className="sr-only">Currently {formatUGX(prices[id])}</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={!inactivePlans.has(id)} onChange={(event) => setInactivePlans((current) => {
                  const next = new Set(current);
                  if (event.target.checked) next.delete(id);
                  else next.add(id);
                  return next;
                })} />
                Available
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={() => void savePlanPrices()} disabled={saving !== null || !supabase} className="rounded-xl">
            {saving === "plans" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save subscription fees
          </Button>
        </div>
      </Card>
    </section>
  );
}
