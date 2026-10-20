"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Eye, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatUGX } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { AdminListingDialog } from "@/components/admin/AdminListingDialog";

type AdminUser = {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  account_kind: string;
  role: string;
  created_at: string;
};

type ManagedListing = {
  id: string;
  user_id: string | null;
  title: string;
  kind: string;
  city: string;
  neighborhood: string;
  hourly_rate: number;
  verification_status: string;
  is_featured: boolean;
  featured_tier: "premium" | "vip" | null;
  featured_until: string | null;
  created_at: string;
};

type ManagedPayment = {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  provider: string;
  amount: number;
  merchant_code: string | null;
  currency: string;
  status: string;
  payer_phone: string | null;
  transaction_id: string | null;
  subscription_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles: { name: string; email: string | null } | { name: string; email: string | null }[] | null;
};

type ManagedSubscription = {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  profiles: { name: string; email: string | null } | { name: string; email: string | null }[] | null;
};

type RelatedProfile = { name: string; email: string | null } | { name: string; email: string | null }[] | null;

const roleOptions = [
  "client_free",
  "client_premium",
  "provider_free",
  "provider_premium",
  "moderator",
  "super_admin",
];

export type AdminManagementSection = "users" | "listings" | "payments" | "subscriptions" | "ads";

function displayName(profile: RelatedProfile) {
  const value = Array.isArray(profile) ? profile[0] : profile;
  return value?.name || value?.email || "Account";
}

export function AdminManagement({
  canManageAdmins,
  section,
  listingKindFilter,
}: {
  canManageAdmins: boolean;
  section: AdminManagementSection;
  listingKindFilter?: "escort" | "service";
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [payments, setPayments] = useState<ManagedPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<ManagedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ManagedListing | null>(null);
  const [createListingKind, setCreateListingKind] = useState<"escort" | "service">("escort");

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Configure Supabase to manage platform records.");
      return;
    }

    const [usersResult, listingsResult, paymentsResult, subscriptionsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,name,phone,account_kind,role,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("listings")
        .select("id,user_id,title,kind,city,neighborhood,hourly_rate,verification_status,is_featured,featured_tier,featured_until,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("payments")
        .select("id,user_id,plan,period,provider,amount,merchant_code,currency,status,payer_phone,transaction_id,subscription_id,rejection_reason,created_at,profiles!payments_user_id_fkey(name,email)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("subscriptions")
        .select("id,user_id,plan,period,status,starts_at,ends_at,profiles(name,email)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const queryError = usersResult.error ?? listingsResult.error ?? paymentsResult.error ?? subscriptionsResult.error;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setUsers((usersResult.data ?? []) as AdminUser[]);
    setListings((listingsResult.data ?? []) as ManagedListing[]);
    setPayments((paymentsResult.data ?? []) as ManagedPayment[]);
    setSubscriptions((subscriptionsResult.data ?? []) as ManagedSubscription[]);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    if (!supabase) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void load(), 200);
    };
    const channel = supabase
      .channel("admin-management-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase?.removeChannel(channel);
    };
  }, [load]);

  const runAction = async (id: string, action: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusyId(id);
    setError("");
    try {
      const result = await action();
      if (result.error) {
        setError(result.error.message);
      } else {
        await load();
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The admin action failed unexpectedly.");
    } finally {
      setBusyId(null);
    }
  };

  const setUserRole = async (user: AdminUser, role: string) => {
    if (!supabase || !canManageAdmins || role === user.role) return;
    await runAction(user.id, () =>
      supabase!.rpc("admin_set_profile_role", { p_user_id: user.id, p_role: role })
    );
  };

  const editUser = async (user: AdminUser) => {
    if (!supabase) return;
    const name = window.prompt("User name", user.name);
    if (name === null) return;
    const phone = window.prompt("Phone number (leave blank to clear)", user.phone ?? "");
    if (phone === null) return;
    const accountKind = window.prompt("Account kind: client, specialist, model, or agency", user.account_kind);
    if (accountKind === null) return;
    if (!name.trim() || name.trim().length > 120 || phone.trim().length > 32) {
      setError("Enter a name of 1–120 characters and a phone number of at most 32 characters.");
      return;
    }
    await runAction(user.id, () =>
      supabase!.rpc("admin_update_profile", {
        p_user_id: user.id,
        p_name: name.trim(),
        p_phone: phone.trim() || null,
        p_account_kind: accountKind.trim(),
      })
    );
  };

  const deleteUser = async (user: AdminUser) => {
    if (!supabase || !canManageAdmins) return;
    if (!window.confirm(`Permanently delete ${user.name} and their account data? This cannot be undone.`)) return;
    await runAction(user.id, () =>
      supabase!.rpc("admin_delete_profile", { p_user_id: user.id })
    );
  };

  const deleteListing = async (listing: ManagedListing) => {
    if (!supabase) return;
    if (!window.confirm(`Permanently delete "${listing.title}" and its related data?`)) return;
    await runAction(listing.id, () =>
      supabase!.rpc("admin_delete_listing", { p_listing_id: listing.id })
    );
  };

  const setAd = async (listing: ManagedListing, featured: boolean) => {
    if (!supabase) return;
    if (featured && listing.verification_status !== "verified") {
      setError("Publish the ad before featuring it.");
      return;
    }
    const tier = featured
      ? window.prompt("Ad tier: premium or vip", listing.featured_tier ?? "premium")
      : null;
    if (featured && tier !== "premium" && tier !== "vip") {
      if (tier !== null) setError("Choose premium or vip for the ad tier.");
      return;
    }
    const until = featured
      ? window.prompt("Ad expiry date (YYYY-MM-DD)", listing.featured_until?.slice(0, 10) ?? "")
      : null;
    if (featured && until === null) return;
    if (featured && (!until || Number.isNaN(Date.parse(`${until}T23:59:59Z`)))) {
      setError("Enter a valid ad expiry date.");
      return;
    }
    await runAction(listing.id, () =>
      supabase!.rpc("admin_set_listing_ad", {
        p_listing_id: listing.id,
        p_featured: featured,
        p_tier: tier,
        p_featured_until: featured ? `${until}T23:59:59Z` : null,
      })
    );
  };

  const publishAd = async (listing: ManagedListing) => {
    if (!supabase || listing.verification_status === "verified") return;
    await runAction(listing.id, async () => {
      const { error: updateError } = await supabase!
        .from("listings")
        .update({ verification_status: "verified", verification_notes: null })
        .eq("id", listing.id);
      return { error: updateError };
    });
  };

  const removeAd = async (listing: ManagedListing) => {
    if (!supabase || !window.confirm(`Remove "${listing.title}" from the public directory? The profile and account will be retained and can be republished later.`)) return;
    await runAction(listing.id, async () => {
      const { error: updateError } = await supabase!
        .from("listings")
        .update({
          verification_status: "suspended",
          is_featured: false,
          featured_tier: null,
          featured_until: null,
        })
        .eq("id", listing.id);
      return { error: updateError };
    });
  };

  const reviewPayment = async (payment: ManagedPayment, action: "verify" | "reject") => {
    if (!supabase) return;
    const reason = action === "reject" ? window.prompt("Reason for rejecting this payment (at least 8 characters):") : null;
    if (action === "reject" && reason === null) return;
    if (action === "reject" && (reason?.trim().length ?? 0) < 8) {
      setError("Enter a rejection reason of at least 8 characters.");
      return;
    }
    await runAction(payment.id, () =>
      supabase!.rpc("admin_review_payment", {
        p_payment_id: payment.id,
        p_action: action,
        p_rejection_reason: reason?.trim() ?? null,
      })
    );
  };

  const deletePayment = async (payment: ManagedPayment) => {
    if (!supabase) return;
    if (!window.confirm("Delete this unverified payment record? Verified payments are retained for audit.")) return;
    await runAction(payment.id, () =>
      supabase!.rpc("admin_delete_payment", { p_payment_id: payment.id })
    );
  };

  const setSubscriptionStatus = async (subscription: ManagedSubscription, status: string) => {
    if (!supabase || status === subscription.status) return;
    await runAction(subscription.id, () =>
      supabase!.rpc("admin_set_subscription_status", {
        p_subscription_id: subscription.id,
        p_status: status,
      })
    );
  };

  const deleteSubscription = async (subscription: ManagedSubscription) => {
    if (!supabase || !window.confirm("Permanently delete this subscription record?")) return;
    await runAction(subscription.id, () =>
      supabase!.rpc("admin_delete_subscription", { p_subscription_id: subscription.id })
    );
  };

  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Loading management records…</p>;

  const visibleListings = listingKindFilter
    ? listings.filter((listing) => listing.kind === listingKindFilter)
    : listings;

  return (
    <section className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Tabs value={section}>
        <TabsContent value="users" className="space-y-2">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email ?? "No email"} · {user.account_kind}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{user.role.replaceAll("_", " ")}</Badge>
                <Button variant="outline" size="sm" disabled={busyId === user.id} onClick={() => void editUser(user)} aria-label={`Edit ${user.name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {canManageAdmins && (
                  <>
                    <select
                      aria-label={`Role for ${user.name}`}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(event) => void setUserRole(user, event.target.value)}
                    >
                      {roleOptions.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
                    </select>
                    <Button variant="outline" size="sm" disabled={busyId === user.id} onClick={() => void deleteUser(user)} aria-label={`Delete ${user.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="listings" className="space-y-2">
          <div className="flex flex-wrap justify-end gap-2">
            {listingKindFilter ? (
              <Button size="sm" onClick={() => {
                setSelectedListing(null);
                setCreateListingKind(listingKindFilter);
                setListingDialogOpen(true);
              }}><Plus className="mr-1 h-4 w-4" />Add {listingKindFilter === "escort" ? "model" : "service provider"}</Button>
            ) : (
              <>
                <Button size="sm" onClick={() => {
                  setSelectedListing(null);
                  setCreateListingKind("escort");
                  setListingDialogOpen(true);
                }}><Plus className="mr-1 h-4 w-4" />Add model</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setSelectedListing(null);
                  setCreateListingKind("service");
                  setListingDialogOpen(true);
                }}><Plus className="mr-1 h-4 w-4" />Add service provider</Button>
              </>
            )}
          </div>
          {visibleListings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No {listingKindFilter === "escort" ? "model" : "service provider"} listings found.
            </p>
          ) : visibleListings.map((listing) => (
            <Card key={listing.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{listing.title}</p>
                <p className="text-xs text-muted-foreground">
                  {listing.kind === "service" ? "Service provider" : "Model"} · {listing.neighborhood}, {listing.city}
                  {listing.kind === "service" && ` · ${formatUGX(listing.hourly_rate)}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Status: {listing.verification_status.replaceAll("_", " ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => {
                  setSelectedListing(listing);
                  setListingDialogOpen(true);
                }}><Eye className="mr-1 h-4 w-4" />View</Button>
                {listing.verification_status !== "verified" && (
                  <Button size="sm" disabled={busyId === listing.id} onClick={() => void runAction(listing.id, async () => {
                    const { error: updateError } = await supabase!.from("listings").update({ verification_status: "verified" }).eq("id", listing.id);
                    return { error: updateError };
                  })}><Check className="mr-1 h-4 w-4" />Approve</Button>
                )}
                {listing.verification_status !== "rejected" && (
                  <Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => void runAction(listing.id, async () => {
                    const { error: updateError } = await supabase!.from("listings").update({ verification_status: "rejected" }).eq("id", listing.id);
                    return { error: updateError };
                  })}><X className="mr-1 h-4 w-4" />Reject</Button>
                )}
                <Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => void deleteListing(listing)} aria-label={`Delete ${listing.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-2">
          {payments.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No payment records found.</p> : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>{["Date", "Account", "Plan", "Provider", "Amount", "Merchant / transaction", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap px-3 py-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3"><p className="font-medium">{displayName(payment.profiles)}</p><p className="text-xs text-muted-foreground">{payment.profiles && !Array.isArray(payment.profiles) ? payment.profiles.email : ""}</p></td>
                      <td className="px-3 py-3 capitalize">{payment.plan.replaceAll("_", " ")} · {payment.period}</td>
                      <td className="px-3 py-3"><span className="capitalize">{payment.provider.replaceAll("_", " ")}</span><p className="text-xs text-muted-foreground">{payment.payer_phone ?? "—"}</p></td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium">{formatUGX(payment.amount)} {payment.currency}</td>
                      <td className="px-3 py-3"><p>Merchant {payment.merchant_code ?? "—"}</p><p className="max-w-48 truncate text-xs text-muted-foreground" title={payment.transaction_id ?? undefined}>{payment.transaction_id ?? "No transaction ID"}</p></td>
                      <td className="px-3 py-3"><Badge variant={payment.status === "verified" ? "default" : "secondary"}>{payment.status}</Badge>{payment.rejection_reason && <p className="mt-1 max-w-48 text-xs text-destructive">{payment.rejection_reason}</p>}</td>
                      <td className="px-3 py-3"><div className="flex gap-1">
                        {payment.status === "submitted" && <>
                          <Button size="sm" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment, "verify")} aria-label="Verify payment"><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment, "reject")} aria-label="Reject payment"><X className="h-4 w-4" /></Button>
                        </>}
                        {payment.status !== "verified" && <Button size="sm" variant="outline" disabled={busyId === payment.id} onClick={() => void deletePayment(payment)} aria-label="Delete payment"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-2">
          {subscriptions.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No subscriptions found.</p> : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>{["Account", "Plan", "Period", "Status", "Starts", "Ends", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-3 py-3"><p className="font-medium">{displayName(subscription.profiles)}</p><p className="text-xs text-muted-foreground">{subscription.profiles && !Array.isArray(subscription.profiles) ? subscription.profiles.email : ""}</p></td>
                      <td className="px-3 py-3 capitalize">{subscription.plan.replaceAll("_", " ")}</td>
                      <td className="px-3 py-3 capitalize">{subscription.period}</td>
                      <td className="px-3 py-3"><Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge></td>
                      <td className="whitespace-nowrap px-3 py-3">{new Date(subscription.starts_at).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-3 py-3">{subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "—"}</td>
                      <td className="px-3 py-3"><div className="flex gap-2">
                        <select aria-label={`Subscription status for ${displayName(subscription.profiles)}`} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" value={subscription.status} disabled={busyId === subscription.id} onChange={(event) => void setSubscriptionStatus(subscription, event.target.value)}>
                          {["active", "pending", "expired", "cancelled"].map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <Button size="sm" variant="outline" disabled={busyId === subscription.id} onClick={() => void deleteSubscription(subscription)} aria-label="Delete subscription"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ads" className="space-y-2">
          {listings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No submitted ads yet.
            </p>
          ) : listings.map((listing) => (
            <Card key={listing.id} className="flex flex-col justify-between gap-4 rounded-2xl p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{listing.title}</p>
                  <Badge variant={listing.verification_status === "verified" ? "default" : "secondary"}>
                    {listing.verification_status === "verified" ? "Published" : listing.verification_status.replaceAll("_", " ")}
                  </Badge>
                  {listing.is_featured && <Badge variant="outline">{(listing.featured_tier ?? "premium").toUpperCase()} featured</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {listing.kind === "service" ? "Service provider" : "Model"} · {listing.neighborhood}, {listing.city}
                  {listing.kind === "service" && ` · ${formatUGX(listing.hourly_rate)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(listing.created_at).toLocaleDateString()}
                  {listing.is_featured && ` · Feature expires ${listing.featured_until ? new Date(listing.featured_until).toLocaleDateString() : "unknown"}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {listing.verification_status !== "verified" && (
                  <Button size="sm" disabled={busyId === listing.id} onClick={() => void publishAd(listing)}>
                    <Check className="mr-1 h-4 w-4" />Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={listing.is_featured ? "outline" : "secondary"}
                  disabled={busyId === listing.id || listing.verification_status !== "verified"}
                  onClick={() => void setAd(listing, !listing.is_featured)}
                >
                  <Shield className="mr-1 h-4 w-4" />{listing.is_featured ? "End feature" : "Mark featured"}
                </Button>
                <Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => void removeAd(listing)}>
                  <Trash2 className="mr-1 h-4 w-4 text-destructive" />Remove ad
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <AdminListingDialog
        open={listingDialogOpen}
        listing={selectedListing}
        createKind={createListingKind}
        onOpenChange={setListingDialogOpen}
        onSaved={() => void load()}
      />
    </section>
  );
}
