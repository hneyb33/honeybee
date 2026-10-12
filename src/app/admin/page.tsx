"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  Image as ImageIcon,
  LoaderCircle,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUGX } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { AdminManagement } from "@/components/admin/AdminManagement";

type QueueStatus = "pending" | "under_review";

interface ListingReview {
  id: string;
  title: string;
  kind: string;
  category: string;
  city: string;
  neighborhood: string;
  verification_status: QueueStatus;
  created_at: string;
  cover_image: string | null;
}

interface PaymentReview {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  provider: string;
  amount: number;
  payer_phone: string | null;
  transaction_id: string | null;
  submitted_at: string | null;
  proof_url: string | null;
  profiles: { name: string; email: string | null }[] | { name: string; email: string | null } | null;
  listings: { title: string }[] | { title: string } | null;
}

interface RecentMedia {
  id: string;
  url: string;
  kind: string;
  created_at: string;
  listings: { title: string }[] | { title: string } | null;
}

interface AdminDashboardData {
  models: number;
  providers: number;
  pendingProfiles: number;
  whatsappBookings: number;
  telegramBookings: number;
  pendingPayments: number;
  listings: ListingReview[];
  payments: PaymentReview[];
  media: RecentMedia[];
}

const emptyDashboard: AdminDashboardData = {
  models: 0,
  providers: 0,
  pendingProfiles: 0,
  whatsappBookings: 0,
  telegramBookings: 0,
  pendingPayments: 0,
  listings: [],
  payments: [],
  media: [],
};

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminModerationDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [canManageAdmins, setCanManageAdmins] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Configure Supabase to use the admin dashboard.");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      router.replace("/login?next=%2Fadmin");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      setLoading(false);
      setError(profileError.message);
      return;
    }

    if (!profile || (profile.role !== "super_admin" && profile.role !== "moderator")) {
      router.replace("/");
      return;
    }
    setCanManageAdmins(profile.role === "super_admin");

    const [
      modelsResult,
      providersResult,
      pendingProfilesResult,
      whatsappResult,
      telegramResult,
      pendingPaymentsResult,
      listingsResult,
      paymentsResult,
      mediaResult,
    ] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("kind", "escort"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("kind", "service"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .in("verification_status", ["pending", "under_review"]),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("channel", "whatsapp"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("channel", "telegram"),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      supabase
        .from("listings")
        .select("id,title,kind,category,city,neighborhood,verification_status,created_at,cover_image")
        .in("verification_status", ["pending", "under_review"])
        .order("created_at", { ascending: true })
        .limit(30),
      supabase
        .from("payments")
        .select("id,user_id,plan,period,provider,amount,payer_phone,transaction_id,submitted_at,proof_url,profiles(name,email),listings(title)")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true })
        .limit(30),
      supabase
        .from("profile_media")
        .select("id,url,kind,created_at,listings(title)")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const queryError = [
      modelsResult.error,
      providersResult.error,
      pendingProfilesResult.error,
      whatsappResult.error,
      telegramResult.error,
      pendingPaymentsResult.error,
      listingsResult.error,
      paymentsResult.error,
      mediaResult.error,
    ].find(Boolean);

    if (queryError) {
      setLoading(false);
      setError(queryError.message);
      return;
    }

    setDashboard({
      models: modelsResult.count ?? 0,
      providers: providersResult.count ?? 0,
      pendingProfiles: pendingProfilesResult.count ?? 0,
      whatsappBookings: whatsappResult.count ?? 0,
      telegramBookings: telegramResult.count ?? 0,
      pendingPayments: pendingPaymentsResult.count ?? 0,
      listings: (listingsResult.data ?? []) as ListingReview[],
      payments: (paymentsResult.data ?? []) as PaymentReview[],
      media: (mediaResult.data ?? []) as RecentMedia[],
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const reviewListing = async (listing: ListingReview, status: "verified" | "rejected") => {
    if (!supabase) return;
    setUpdatingId(listing.id);
    setError("");

    const { data, error: updateError } = await supabase
      .from("listings")
      .update({ verification_status: status })
      .eq("id", listing.id)
      .eq("verification_status", listing.verification_status)
      .select("id")
      .maybeSingle();

    if (updateError || !data) {
      setError(updateError?.message ?? "This listing was already reviewed. Refresh the queue and try again.");
      setUpdatingId(null);
      return;
    }

    await loadDashboard();
    setUpdatingId(null);
  };

  const reviewPayment = async (payment: PaymentReview, action: "verify" | "reject") => {
    if (!supabase) return;
    const enteredReason = action === "reject" ? window.prompt("Enter the reason for rejecting this payment:") : null;
    if (action === "reject" && enteredReason === null) return;
    const rejectionReason = enteredReason?.trim() ?? null;

    if (action === "reject" && (!rejectionReason || rejectionReason.length < 8)) {
      setError("Enter a rejection reason of at least 8 characters.");
      return;
    }

    setUpdatingId(payment.id);
    setError("");
    const { error: reviewError } = await supabase.rpc("admin_review_payment", {
      p_payment_id: payment.id,
      p_action: action,
      p_rejection_reason: rejectionReason ?? null,
    });

    if (reviewError) {
      setError(reviewError.message);
      setUpdatingId(null);
      return;
    }

    await loadDashboard();
    setUpdatingId(null);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <Badge variant="vip" className="mb-1 text-xs">
            <ShieldCheck className="mr-1 h-3 w-3" /> Honeybee Admin
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Platform dashboard
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Review listing verification and submitted Mobile Money payments.
          </p>
        </div>
        <Button variant="outline" onClick={signOut} className="rounded-full">
          Sign out
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isSupabaseConfigured ? (
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
          Add the Supabase project URL and anon key to enable the admin dashboard.
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Models" value={dashboard.models} />
            <StatCard label="Private service providers" value={dashboard.providers} />
            <StatCard label="Profiles awaiting review" value={dashboard.pendingProfiles} />
            <StatCard label="WhatsApp bookings" value={dashboard.whatsappBookings} />
            <StatCard label="Telegram bookings" value={dashboard.telegramBookings} />
            <StatCard label="Payments to review" value={dashboard.pendingPayments} />
          </div>

          <Tabs defaultValue="verifications" className="w-full">
            <TabsList className="mb-5 rounded-full bg-muted p-1">
              <TabsTrigger value="verifications" className="rounded-full text-xs font-semibold">
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                Profile reviews ({dashboard.listings.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-full text-xs font-semibold">
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Payment reviews ({dashboard.payments.length})
              </TabsTrigger>
              <TabsTrigger value="management" className="rounded-full text-xs font-semibold">
                Manage platform
              </TabsTrigger>
            </TabsList>

            <TabsContent value="management">
              <AdminManagement canManageAdmins={canManageAdmins} />
            </TabsContent>

            <TabsContent value="verifications" className="space-y-3">
              {dashboard.listings.length === 0 ? (
                <EmptyQueue>No profiles are waiting for review.</EmptyQueue>
              ) : (
                dashboard.listings.map((listing) => (
                  <Card key={listing.id} className="rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-4">
                        {listing.cover_image ? (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                            <Image src={listing.cover_image} alt="" fill unoptimized className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="truncate font-bold">{listing.title}</h2>
                          <p className="text-xs text-muted-foreground">
                            {listing.kind === "service" ? "Service provider" : "Model"} · {listing.category} ·{" "}
                            {listing.neighborhood}, {listing.city}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Submitted {relativeTime(listing.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{listing.verification_status.replace("_", " ")}</Badge>
                        <Button
                          disabled={updatingId === listing.id}
                          onClick={() => void reviewListing(listing, "verified")}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Check className="mr-1 h-4 w-4" /> Verify
                        </Button>
                        <Button
                          variant="outline"
                          disabled={updatingId === listing.id}
                          onClick={() => void reviewListing(listing, "rejected")}
                          className="rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-3">
              {dashboard.payments.length === 0 ? (
                <EmptyQueue>No submitted payments are waiting for review.</EmptyQueue>
              ) : (
                dashboard.payments.map((payment) => (
                  <Card key={payment.id} className="rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <h2 className="font-bold">
                          {(Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles)?.name ??
                            (Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles)?.email ??
                            "Account"}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.plan} · {payment.period} · {payment.provider.replaceAll("_", " ")}
                        </p>
                        {(Array.isArray(payment.listings) ? payment.listings[0] : payment.listings)?.title && (
                          <p className="mt-1 text-xs font-semibold text-[#c63843]">
                            Ad feature: {(Array.isArray(payment.listings) ? payment.listings[0] : payment.listings)?.title}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Phone: {payment.payer_phone ?? "—"} · Transaction: {payment.transaction_id ?? "—"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {payment.submitted_at ? relativeTime(payment.submitted_at) : "—"}
                        </p>
                        {payment.proof_url && (
                          <a
                            href={payment.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-airbnb-coral hover:underline"
                          >
                            View payment proof
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <strong className="mr-2 text-lg font-extrabold text-airbnb-coral">
                          {formatUGX(payment.amount)}
                        </strong>
                        <Button
                          disabled={updatingId === payment.id}
                          onClick={() => void reviewPayment(payment, "verify")}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {(Array.isArray(payment.listings) ? payment.listings[0] : payment.listings)?.title
                            ? "Verify & feature ad"
                            : "Verify & activate"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={updatingId === payment.id}
                          onClick={() => void reviewPayment(payment, "reject")}
                          className="rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          <section className="space-y-3 border-t border-border pt-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ImageIcon className="h-5 w-5 text-airbnb-coral" /> Recently submitted media
              </h2>
              <p className="text-xs text-muted-foreground">Latest photos and videos added to provider profiles.</p>
            </div>
            {dashboard.media.length === 0 ? (
              <EmptyQueue>No profile media has been submitted.</EmptyQueue>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {dashboard.media.map((media) => (
                  <div key={media.id} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      <Image src={media.url} alt="" fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
                    </div>
                    <p className="mt-1 truncate text-xs font-medium">
                      {(Array.isArray(media.listings) ? media.listings[0] : media.listings)?.title ?? "Profile media"}
                    </p>
                    <p className="text-xs text-muted-foreground">{media.kind} · {relativeTime(media.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
    </Card>
  );
}

function EmptyQueue({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
