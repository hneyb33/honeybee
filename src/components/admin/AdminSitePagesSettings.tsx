"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE_PAGES, SitePageContent, SitePageSlug } from "@/lib/site-pages";
import { supabase } from "@/lib/supabase/client";

type StoredSitePage = SitePageContent & { updated_at?: string | null };
type PageContentMap = Record<SitePageSlug, StoredSitePage>;

const defaultPages = () =>
  Object.fromEntries(SITE_PAGES.map((page) => [page.slug, page])) as PageContentMap;

export function AdminSitePagesSettings() {
  const [pages, setPages] = useState<PageContentMap>(defaultPages);
  const [selectedSlug, setSelectedSlug] = useState<SitePageSlug>("faqs");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const page = pages[selectedSlug];

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      setError("Configure Supabase and apply the editable site pages migration to manage published page content.");
      return;
    }
    let cancelled = false;

    const loadPages = async () => {
      const { data, error: loadError } = await client
        .from("site_pages")
        .select("page_key,title,content,updated_at");

      if (cancelled) return;
      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setPages((current) => {
        const next = { ...current };
        for (const row of data ?? []) {
          if (SITE_PAGES.some((sitePage) => sitePage.slug === row.page_key)) {
            const slug = row.page_key as SitePageSlug;
            next[slug] = { slug, title: row.title, content: row.content, updated_at: row.updated_at };
          }
        }
        return next;
      });
      setError("");
      setLoading(false);
    };

    void loadPages();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePage = (field: "title" | "content", value: string) => {
    setPages((current) => ({
      ...current,
      [selectedSlug]: { ...current[selectedSlug], [field]: value },
    }));
    setNotice("");
  };

  const savePage = async () => {
    const client = supabase;
    if (!client) {
      setError("Supabase is not configured.");
      return;
    }
    if (!page.title.trim() || !page.content.trim()) {
      setError("Enter both a page title and page content before publishing.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) {
      setError(authError?.message ?? "Sign in again before publishing page content.");
      setSaving(false);
      return;
    }

    const updatedAt = new Date().toISOString();
    const { error: saveError } = await client.from("site_pages").upsert({
      page_key: selectedSlug,
      title: page.title.trim(),
      content: page.content.trim(),
      updated_at: updatedAt,
      updated_by: authData.user.id,
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setPages((current) => ({
      ...current,
      [selectedSlug]: { ...current[selectedSlug], updated_at: updatedAt },
    }));
    setNotice(`${page.title.trim()} has been published.`);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading page settings...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Public page content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit each public information page separately. Content is plain text; blank lines create new sections.
        </p>
      </div>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Editable public pages" className="flex gap-2 overflow-x-auto xl:flex-col">
          {SITE_PAGES.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setSelectedSlug(item.slug)}
              aria-current={selectedSlug === item.slug ? "page" : undefined}
              className={`shrink-0 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors xl:w-full ${
                selectedSlug === item.slug
                  ? "border-[#d3444d] bg-[#d3444d]/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.title}
            </button>
          ))}
        </nav>

        <Card className="space-y-4 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Editing /{selectedSlug}</p>
            <Link href={`/${selectedSlug}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c63843] hover:underline">
              Preview page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            Page title
            <input
              value={page.title}
              maxLength={120}
              onChange={(event) => updatePage("title", event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Page content
            {selectedSlug === "faqs" && (
              <span className="block text-xs font-normal text-muted-foreground">
                For each FAQ, put the question on the first line, the answer below it, and leave a blank line before the next question.
              </span>
            )}
            <textarea
              value={page.content}
              onChange={(event) => updatePage("content", event.target.value)}
              rows={18}
              maxLength={30000}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {page.updated_at ? `Last published ${new Date(page.updated_at).toLocaleString()}` : "Using the starter content until published."}
            </p>
            <Button type="button" onClick={() => void savePage()} disabled={saving || !supabase} className="rounded-xl">
              {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Publishing..." : "Publish changes"}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
