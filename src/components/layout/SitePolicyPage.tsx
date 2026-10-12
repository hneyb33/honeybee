"use client";

import { useEffect, useState } from "react";
import { FileText, HelpCircle, Shield, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export type SitePageKey = "privacy" | "terms" | "faqs" | "disclaimer";

type SitePage = {
  title: string;
  content: string;
};

const fallbackPages: Record<SitePageKey, SitePage> = {
  privacy: {
    title: "Privacy Policy",
    content:
      "Honeybee is committed to protecting your privacy and confidential identity. Contact Honeybee support with any questions about our privacy practices.",
  },
  terms: {
    title: "Terms and Conditions",
    content:
      "By accessing, browsing, or listing on Honeybee, you agree to comply with the platform terms. You must be at least 18 years old to use Honeybee.",
  },
  faqs: {
    title: "Frequently Asked Questions",
    content:
      "Create an account, complete your profile, and submit it for review. Contact a provider through the options on their verified profile.",
  },
  disclaimer: {
    title: "Disclaimer",
    content:
      "Honeybee is a discovery and listing platform. Listed providers are independent, and users should make informed decisions when arranging services.",
  },
};

const pageIcons = {
  privacy: Shield,
  terms: FileText,
  faqs: HelpCircle,
  disclaimer: TriangleAlert,
};

export function SitePolicyPage({ pageKey }: { pageKey: SitePageKey }) {
  const [page, setPage] = useState(fallbackPages[pageKey]);
  const [error, setError] = useState("");
  const Icon = pageIcons[pageKey];

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const loadPage = async () => {
      const { data, error: queryError } = await client
        .from("site_pages")
        .select("title,content")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      if (data) setPage({ title: data.title, content: data.content });
    };

    void loadPage();
    const channel = client
      .channel(`public-site-page-${pageKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_pages", filter: `page_key=eq.${pageKey}` }, () => {
        void loadPage();
      })
      .subscribe();
    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [pageKey]);

  return (
    <article className="mx-auto min-h-[55vh] max-w-4xl space-y-6 px-4 py-12 sm:px-6">
      <header className="border-b border-border pb-5">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-foreground">
          <Icon className="h-7 w-7 shrink-0 text-airbnb-coral" />
          {page.title}
        </h1>
      </header>
      {error && (
        <p role="status" className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-200">
          Showing the available page content. Could not load the latest admin-edited copy: {error}
        </p>
      )}
      <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
        {page.content}
      </div>
    </article>
  );
}
