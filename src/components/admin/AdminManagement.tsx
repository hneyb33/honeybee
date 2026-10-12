"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Save, Shield, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUGX } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

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
  amount: number;
  currency: string;
  status: string;
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
type SitePageKey = "privacy" | "terms" | "faqs" | "disclaimer";
type EditableSitePage = { page_key: SitePageKey; title: string; content: string };

const editablePages: Array<{ key: SitePageKey; label: string }> = [
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms and Conditions" },
  { key: "faqs", label: "FAQs" },
  { key: "disclaimer", label: "Disclaimer" },
];

const roleOptions = [
  "client_free",
  "client_premium",
  "provider_free",
  "provider_premium",
  "moderator",
  "super_admin",
];

function displayName(profile: RelatedProfile) {
  const value = Array.isArray(profile) ? profile[0] : profile;
  return value?.name || value?.email || "Account";
}

export function AdminManagement({ canManageAdmins }: { canManageAdmins: boolean }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [payments, setPayments] = useState<ManagedPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<ManagedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
        .select("id,user_id,plan,amount,currency,status,created_at,profiles(name,email)")
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

  const editListing = async (listing: ManagedListing) => {
    if (!supabase) return;
    const title = window.prompt("Listing title", listing.title);
    if (title === null) return;
    const city = window.prompt("City", listing.city);
    if (city === null) return;
    const rate = window.prompt("Hourly rate (UGX)", String(listing.hourly_rate));
    if (rate === null) return;
    const hourlyRate = Number(rate);
    if (!title.trim() || !city.trim() || !Number.isSafeInteger(hourlyRate) || hourlyRate < 0) {
      setError("Enter a title, city, and a valid non-negative hourly rate.");
      return;
    }
    await runAction(listing.id, async () => {
      const { error: updateError } = await supabase!
        .from("listings")
        .update({ title: title.trim(), city: city.trim(), hourly_rate: hourlyRate })
        .eq("id", listing.id);
      return { error: updateError };
    });
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

  return (
    <section className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Tabs defaultValue="users">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="listings">Models &amp; providers ({listings.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
          <TabsTrigger value="ads">Ads ({listings.filter((item) => item.is_featured).length})</TabsTrigger>
          <TabsTrigger value="settings">Website settings</TabsTrigger>
        </TabsList>

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
          {listings.map((listing) => (
            <Card key={listing.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.kind === "service" ? "Service provider" : "Model"} · {listing.neighborhood}, {listing.city} · {formatUGX(listing.hourly_rate)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Status: {listing.verification_status.replaceAll("_", " ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => void editListing(listing)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
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
          {payments.map((payment) => (
            <Card key={payment.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{displayName(payment.profiles)} · {formatUGX(payment.amount)}</p>
                <p className="text-xs text-muted-foreground">{payment.plan.replaceAll("_", " ")} · {payment.status}</p>
              </div>
              <div className="flex gap-2">
                {payment.status === "submitted" && <>
                  <Button size="sm" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment, "verify")}><Check className="mr-1 h-4 w-4" />Verify</Button>
                  <Button size="sm" variant="outline" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment, "reject")}><X className="mr-1 h-4 w-4" />Reject</Button>
                </>}
                {payment.status !== "verified" && <Button size="sm" variant="outline" disabled={busyId === payment.id} onClick={() => void deletePayment(payment)} aria-label="Delete payment"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-2">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{displayName(subscription.profiles)} · {subscription.plan.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{subscription.period} · ends {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "—"}</p>
              </div>
              <div className="flex gap-2">
                <select aria-label={`Subscription status for ${displayName(subscription.profiles)}`} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" value={subscription.status} disabled={busyId === subscription.id} onChange={(event) => void setSubscriptionStatus(subscription, event.target.value)}>
                  {["active", "pending", "expired", "cancelled"].map((status) => <option key={status}>{status}</option>)}
                </select>
                <Button size="sm" variant="outline" disabled={busyId === subscription.id} onClick={() => void deleteSubscription(subscription)} aria-label="Delete subscription"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ads" className="space-y-2">
          {listings.map((listing) => (
            <Card key={listing.id} className="flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.is_featured ? `${listing.featured_tier ?? "premium"} ad · expires ${listing.featured_until ? new Date(listing.featured_until).toLocaleDateString() : "unknown"}` : "Not currently advertised"}</p>
              </div>
              <Button size="sm" variant={listing.is_featured ? "outline" : "default"} disabled={busyId === listing.id} onClick={() => void setAd(listing, !listing.is_featured)}>
                <Shield className="mr-1 h-4 w-4" />{listing.is_featured ? "End ad" : "Promote"}
              </Button>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings">
          <SitePageSettings />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SitePageSettings() {
  const [pages, setPages] = useState<EditableSitePage[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [savingPage, setSavingPage] = useState<SitePageKey | null>(null);
  const [pageError, setPageError] = useState("");
  const [savedPage, setSavedPage] = useState<SitePageKey | null>(null);

  const loadPages = useCallback(async () => {
    if (!supabase) {
      setPageError("Configure Supabase to edit website pages.");
      setLoadingPages(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from("site_pages")
      .select("page_key,title,content")
      .order("page_key");
    if (queryError) {
      setPageError(queryError.message);
      setLoadingPages(false);
      return;
    }
    setPages((data ?? []) as EditableSitePage[]);
    setPageError("");
    setLoadingPages(false);
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const updatePage = (key: SitePageKey, updates: Partial<EditableSitePage>) => {
    setPages((current) => current.map((page) => page.page_key === key ? { ...page, ...updates } : page));
    setSavedPage(null);
  };

  const savePage = async (page: EditableSitePage) => {
    if (!supabase) return;
    if (!page.title.trim() || page.title.length > 120 || page.content.length > 50000) {
      setPageError("Enter a title of 1–120 characters and page content no longer than 50,000 characters.");
      return;
    }

    setSavingPage(page.page_key);
    setPageError("");
    setSavedPage(null);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setPageError(authError?.message ?? "Your session expired. Sign in again to save website content.");
      setSavingPage(null);
      return;
    }

    const { error: saveError } = await supabase
      .from("site_pages")
      .upsert({
        page_key: page.page_key,
        title: page.title.trim(),
        content: page.content,
        updated_at: new Date().toISOString(),
        updated_by: authData.user.id,
      });
    if (saveError) {
      setPageError(saveError.message);
    } else {
      setSavedPage(page.page_key);
    }
    setSavingPage(null);
  };

  if (loadingPages) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading website settings…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">Public page content</h3>
        <p className="text-sm text-muted-foreground">
          Edit the titles and copy shown on the footer-linked policy, FAQ, and disclaimer pages. Plain text and line breaks are supported.
        </p>
      </div>
      {pageError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{pageError}</p>}
      {pages.length === 0 && !pageError && (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No editable pages are configured.</p>
      )}
      {editablePages.map(({ key, label }) => {
        const page = pages.find((item) => item.page_key === key);
        if (!page) return null;
        return (
          <Card key={key} className="space-y-3 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-semibold">{label}</h4>
              <Button
                size="sm"
                disabled={savingPage !== null}
                onClick={() => void savePage(page)}
                className="rounded-xl"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {savingPage === key ? "Saving…" : savedPage === key ? "Saved" : "Save changes"}
              </Button>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              Page title
              <input
                value={page.title}
                maxLength={120}
                onChange={(event) => updatePage(key, { title: event.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Page content
              <textarea
                value={page.content}
                maxLength={50000}
                rows={9}
                onChange={(event) => updatePage(key, { content: event.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal leading-6"
              />
            </label>
          </Card>
        );
      })}
    </div>
  );
}
