"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, HelpCircle, LockKeyhole, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getDefaultSitePage, SITE_PAGES, SitePageSlug } from "@/lib/site-pages";

const PAGE_ICONS = {
  faqs: HelpCircle,
  privacy: LockKeyhole,
  terms: FileText,
  disclaimer: ShieldAlert,
} satisfies Record<SitePageSlug, typeof HelpCircle>;

export function SiteContentPage({ slug }: { slug: SitePageSlug }) {
  const fallback = getDefaultSitePage(slug);
  const [page, setPage] = useState(fallback);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const Icon = PAGE_ICONS[slug];
  const paragraphs = page.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const loadPage = async () => {
      const { data, error } = await client
        .from("site_pages")
        .select("page_key,title,content,updated_at")
        .eq("page_key", slug)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (data) {
        setPage({ slug, title: data.title, content: data.content });
        setUpdatedAt(data.updated_at);
      }
    };

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <article className="relative isolate mx-auto my-8 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] shadow-2xl sm:my-12">
      <div className="absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-[#d3444d]/15 blur-3xl" />
      <div className="absolute -bottom-36 -left-24 -z-10 h-72 w-72 rounded-full bg-[#e5b34c]/10 blur-3xl" />

      <header className="border-b border-neutral-800 px-6 py-10 sm:px-12 sm:py-14">
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.22em] text-[#e5b34c] hover:text-amber-200">
          Honeybee <span className="px-1 text-neutral-600">/</span> Help &amp; information
        </Link>
        <div className="mt-6 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d3444d]/30 bg-[#d3444d]/10 text-[#f17d83]">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f17d83]">
              Honeybee information
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-2 text-xs text-neutral-400">
              {updatedAt
                ? `Updated ${new Date(updatedAt).toLocaleDateString()}`
                : "Information for the Honeybee community"}
            </p>
          </div>
        </div>
      </header>

      {loadError && (
        <p role="status" className="mx-6 mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 sm:mx-12">
          We could not load the latest published copy. Showing the available page content instead.
        </p>
      )}

      <div className="space-y-4 px-6 py-8 sm:px-12 sm:py-10">
        {slug === "faqs"
          ? paragraphs.map((item, index) => {
              const [question, ...answerLines] = item.split("\n");
              const answer = answerLines.join("\n").trim();
              return (
                <details key={`${question}-${index}`} className="group rounded-2xl border border-neutral-800 bg-black/20 p-5 open:border-[#d3444d]/40">
                  <summary className="cursor-pointer list-none pr-6 font-semibold text-neutral-100 marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {question}
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 rotate-90 text-[#f17d83] transition-transform group-open:-rotate-90" />
                    </span>
                  </summary>
                  {answer && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-300">{answer}</p>}
                </details>
              );
            })
          : paragraphs.map((paragraph, index) => {
              const [heading, ...bodyLines] = paragraph.split("\n");
              const body = bodyLines.join("\n").trim();
              const isSection = Boolean(body);
              return (
                <section key={`${heading}-${index}`} className="rounded-2xl border border-neutral-800/80 bg-black/20 p-5 sm:p-6">
                  {isSection && <h2 className="font-semibold text-white">{heading}</h2>}
                  <p className={`${isSection ? "mt-2" : ""} whitespace-pre-wrap text-sm leading-7 text-neutral-300`}>
                    {isSection ? body : paragraph}
                  </p>
                </section>
              );
            })}
      </div>

      <nav aria-label="Honeybee information pages" className="flex flex-wrap gap-2 border-t border-neutral-800 px-6 py-5 sm:px-12">
        {SITE_PAGES.filter((item) => item.slug !== slug).map((item) => (
          <Link
            key={item.slug}
            href={`/${item.slug}`}
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-[#e5b34c]/60 hover:text-white"
          >
            {item.title}
          </Link>
        ))}
      </nav>
      {loadError && <span className="sr-only">{loadError}</span>}
    </article>
  );
}
