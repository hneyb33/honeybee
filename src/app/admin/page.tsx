"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Building2,
  Check,
  CreditCard,
  FileText,
  Image as ImageIcon,
  List,
  LoaderCircle,
  Megaphone,
  MessageCircle,
  ReceiptText,
  Settings2,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUGX } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { AdminSitePagesSettings } from "@/components/admin/AdminSitePagesSettings";
import { AdminBillingSettings } from "@/components/admin/AdminBillingSettings";

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
  age: number | null;
  gender: string | null;
  nationality: string | null;
  description: string;
  summary_line: string | null;
  images: string[];
  hourly_rate: number;
  services_offered: string[];
  languages: string[];
  availability: Array<{ label: string; on: boolean; from?: string; to?: string }>;
  whatsapp_number: string | null;
  whatsapp_code: string | null;
  telegram: string | null;
  media: Array<{ id: string; url: string; kind: "photo" | "video"; sort_order: number; thumbnail_url: string | null }>;
}

interface PaymentReview {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  provider: string;
  amount: number;
  merchant_code: string | null;
  payer_phone: string | null;
  transaction_id: string | null;
  submitted_at: string | null;
  proof_url: string | null;
  profiles: { name: string; email: string | null }[] | { name: string; email: string | null } | null;
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
        .select("id,title,kind,category,city,neighborhood,verification_status,created_at,cover_image,images,age,gender,nationality,description,summary_line,hourly_rate,services_offered,languages,availability,whatsapp_number,whatsapp_code,telegram")
        .in("verification_status", ["pending", "under_review"])
        .order("created_at", { ascending: true })
        .limit(30),
      supabase
        .from("payments")
        .select("id,user_id,plan,period,provider,amount,merchant_code,payer_phone,transaction_id,submitted_at,proof_url,profiles!payments_user_id_fkey(name,email),listings(title)")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true })
        .limit(30),
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
    ].find(Boolean);

    if (queryError) {
      setLoading(false);
      setError(queryError.message);
      return;
    }

    const pendingListings = listingsResult.data ?? [];
    const listingIds = pendingListings.map((listing) => listing.id);
    const mediaByListing = new Map<string, ListingReview["media"]>();
    if (listingIds.length > 0) {
      const { data: media, error: mediaError } = await supabase
        .from("profile_media")
        .select("id,url,kind,listing_id,sort_order,thumbnail_url")
        .in("listing_id", listingIds)
        .order("sort_order", { ascending: true });
      if (mediaError) {
        setLoading(false);
        setError(mediaError.message);
        return;
      }
      for (const item of media ?? []) {
        const listingMedia = mediaByListing.get(item.listing_id) ?? [];
        listingMedia.push({
          id: item.id,
          url: item.url,
          kind: item.kind === "video" ? "video" : "photo",
          sort_order: item.sort_order,
          thumbnail_url: item.thumbnail_url,
        });
        mediaByListing.set(item.listing_id, listingMedia);
      }
    }

    setDashboard({
      models: modelsResult.count ?? 0,
      providers: providersResult.count ?? 0,
      pendingProfiles: pendingProfilesResult.count ?? 0,
      whatsappBookings: whatsappResult.count ?? 0,
      telegramBookings: telegramResult.count ?? 0,
      pendingPayments: pendingPaymentsResult.count ?? 0,
      listings: pendingListings.map((listing) => ({
        ...listing,
        media: mediaByListing.get(listing.id) ?? (listing.images ?? []).map((url: string, index: number) => ({
          id: `legacy-${listing.id}-${index}`,
          url,
          kind: "photo" as const,
          sort_order: index,
        })),
      })) as ListingReview[],
      payments: (paymentsResult.data ?? []) as PaymentReview[],
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
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b82ff] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">Honeybee</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="vip" className="text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" /> Admin
            </Badge>
            <Button variant="outline" onClick={signOut} className="rounded-xl">Sign out</Button>
          </div>
        </header>

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
          <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 px-6 py-5 dark:border-sky-900/50 dark:bg-sky-950/30 sm:px-8">
            <div className="absolute -right-8 -top-20 h-48 w-48 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-600/10" />
            <div className="relative flex items-center gap-4">
                <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-neutral-900 sm:flex">🐝</div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Welcome back, Honeybee Admin</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Your platform overview and moderation activity.</p>
                </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Models" value={dashboard.models} icon={UserRound} tone="teal" />
            <StatCard label="Service providers" value={dashboard.providers} icon={Building2} tone="rose" />
            <StatCard label="Profiles to review" value={dashboard.pendingProfiles} icon={UserCheck} tone="sky" />
            <StatCard label="WhatsApp bookings" value={dashboard.whatsappBookings} icon={MessageCircle} tone="amber" />
            <StatCard label="Telegram bookings" value={dashboard.telegramBookings} icon={MessageCircle} tone="violet" />
            <StatCard label="Payments to review" value={dashboard.pendingPayments} icon={CreditCard} tone="rose" />
          </div>

          <Tabs defaultValue="overview" className="grid w-full gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24">
                <div className="px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Home</div>
                <TabsList aria-label="Dashboard navigation" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
                  <TabsTrigger value="overview" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none">
                    <List className="mr-2 h-4 w-4" /> Overview
                  </TabsTrigger>
                </TabsList>
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Reviews</div>
                <TabsList aria-label="Review modules" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
                  <TabsTrigger value="verifications" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none">
                    <UserCheck className="mr-2 h-4 w-4" /> Profile reviews <span className="ml-auto text-xs">{dashboard.listings.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="payment-reviews" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none">
                    <CreditCard className="mr-2 h-4 w-4" /> Payment reviews <span className="ml-auto text-xs">{dashboard.payments.length}</span>
                  </TabsTrigger>
                </TabsList>
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Profiles &amp; users</div>
                <TabsList aria-label="Profile and user modules" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
                  <TabsTrigger value="models" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><UserRound className="mr-2 h-4 w-4" /> Models</TabsTrigger>
                  <TabsTrigger value="service-providers" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><Building2 className="mr-2 h-4 w-4" /> Service providers</TabsTrigger>
                  <TabsTrigger value="listings" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><List className="mr-2 h-4 w-4" /> All listings</TabsTrigger>
                  <TabsTrigger value="users" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><Users className="mr-2 h-4 w-4" /> Users &amp; roles</TabsTrigger>
                </TabsList>
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Payments</div>
                <TabsList aria-label="Payment modules" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
                  <TabsTrigger value="managed-payments" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><ReceiptText className="mr-2 h-4 w-4" /> Payment records</TabsTrigger>
                  <TabsTrigger value="subscriptions" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><BadgeDollarSign className="mr-2 h-4 w-4" /> Subscriptions</TabsTrigger>
                  <TabsTrigger value="billing-settings" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><Settings2 className="mr-2 h-4 w-4" /> Billing settings</TabsTrigger>
                </TabsList>
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Platform</div>
                <TabsList aria-label="Platform modules" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
                  <TabsTrigger value="ads" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><Megaphone className="mr-2 h-4 w-4" /> Advertising</TabsTrigger>
                  <TabsTrigger value="site-settings" className="w-full justify-start rounded-xl px-3 py-2.5 text-sm data-[state=active]:bg-[#5b82ff] data-[state=active]:text-white data-[state=active]:shadow-none"><FileText className="mr-2 h-4 w-4" /> Site settings</TabsTrigger>
                </TabsList>
            </aside>

            <div className="min-w-0">
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
                    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="font-bold">Platform activity</h2>
                          <p className="mt-1 text-xs text-muted-foreground">Current review and engagement snapshot</p>
                        </div>
                        <Badge variant="secondary">Live totals</Badge>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <OverviewMetric label="Profile reviews waiting" value={dashboard.pendingProfiles} description="Listings needing moderation" />
                        <OverviewMetric label="Payments waiting" value={dashboard.pendingPayments} description="Submitted payments to verify" />
                        <OverviewMetric label="WhatsApp bookings" value={dashboard.whatsappBookings} description="Bookings via WhatsApp" />
                        <OverviewMetric label="Telegram bookings" value={dashboard.telegramBookings} description="Bookings via Telegram" />
                      </div>
                    </Card>
                    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                      <h2 className="font-bold">Review summary</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Queues needing admin attention</p>
                      <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-neutral-800">
                          <span className="text-sm font-medium">Profile verification</span><Badge variant="secondary">{dashboard.listings.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-neutral-800">
                          <span className="text-sm font-medium">Payment verification</span><Badge variant="secondary">{dashboard.payments.length}</Badge>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="models" className="mt-0">
                  <AdminManagement canManageAdmins={canManageAdmins} section="listings" listingKindFilter="escort" />
                </TabsContent>
                <TabsContent value="service-providers" className="mt-0">
                  <AdminManagement canManageAdmins={canManageAdmins} section="listings" listingKindFilter="service" />
                </TabsContent>
                <TabsContent value="users" className="mt-0">
              <AdminManagement canManageAdmins={canManageAdmins} section="users" />
            </TabsContent>
                <TabsContent value="listings" className="mt-0">
              <AdminManagement canManageAdmins={canManageAdmins} section="listings" />
            </TabsContent>
                <TabsContent value="managed-payments" className="mt-0">
              <AdminManagement canManageAdmins={canManageAdmins} section="payments" />
            </TabsContent>
                <TabsContent value="subscriptions" className="mt-0">
              <AdminManagement canManageAdmins={canManageAdmins} section="subscriptions" />
            </TabsContent>
                <TabsContent value="billing-settings" className="mt-0">
                  <AdminBillingSettings />
            </TabsContent>
                <TabsContent value="ads" className="mt-0">
                  <AdminManagement canManageAdmins={canManageAdmins} section="ads" />
            </TabsContent>
                <TabsContent value="site-settings" className="mt-0">
                  <AdminSitePagesSettings />
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
                    <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Profile details</h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{listing.description || listing.summary_line || "No profile description provided."}</p>
                        <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                          <div><dt className="text-muted-foreground">Age / gender</dt><dd>{listing.age ? `${listing.age} · ${listing.gender ?? "Not specified"}` : listing.gender ?? "Not applicable"}</dd></div>
                          <div><dt className="text-muted-foreground">Nationality</dt><dd>{listing.nationality ?? "Not specified"}</dd></div>
                          {listing.kind === "service" && <div><dt className="text-muted-foreground">Hourly rate</dt><dd>{formatUGX(listing.hourly_rate || 0)}</dd></div>}
                          <div><dt className="text-muted-foreground">Languages</dt><dd>{listing.languages?.join(", ") || "Not specified"}</dd></div>
                          <div><dt className="text-muted-foreground">Services</dt><dd>{listing.services_offered?.join(", ") || "Not specified"}</dd></div>
                          <div><dt className="text-muted-foreground">Availability</dt><dd>{listing.availability?.filter((day) => day.on).map((day) => `${day.label} ${day.from ?? ""}-${day.to ?? ""}`).join(", ") || "Not specified"}</dd></div>
                          <div><dt className="text-muted-foreground">WhatsApp</dt><dd>{listing.whatsapp_number ? `${listing.whatsapp_code ?? ""} ${listing.whatsapp_number}` : "Not provided"}</dd></div>
                          {listing.telegram && <div><dt className="text-muted-foreground">Telegram</dt><dd>{listing.telegram}</dd></div>}
                        </dl>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Submitted photos and videos</h3>
                          <span className="text-xs text-muted-foreground">{listing.media.length} items</span>
                        </div>
                        {listing.media.length === 0 ? (
                          listing.cover_image ? (
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                              <Image src={listing.cover_image} alt={`${listing.title} cover photo`} fill unoptimized className="object-cover" />
                            </div>
                          ) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No portfolio media submitted.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {listing.media.map((media) => (
                              <div key={media.id} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black">
                                {media.kind === "video" ? (
                                  <video src={media.url} poster={media.thumbnail_url ?? undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={`Profile video for ${listing.title}`} />
                                ) : (
                                  <Image src={media.url} alt={`Profile photo for ${listing.title}`} fill unoptimized className="object-cover" />
                                )}
                                <Badge variant="secondary" className="absolute left-2 top-2 capitalize">{media.kind}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="payment-reviews" className="space-y-3">
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
                          Merchant code: {payment.merchant_code ?? "—"}
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
            </div>
          </Tabs>
        </>
      )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "teal" | "rose" | "sky" | "amber" | "violet";
}) {
  const tones = {
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300",
  };
  return (
    <Card className={`rounded-2xl border-0 p-4 shadow-sm ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-xs font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
    </Card>
  );
}

function OverviewMetric({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/70">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyQueue({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
