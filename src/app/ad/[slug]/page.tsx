"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Phone, Send, ExternalLink, Crown } from "lucide-react";
import { Ad } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAdBySlug } from "@/lib/supabase/ads";
import { CountryFlagBadge } from "@/components/listings/CountryFlagBadge";

const AD_TYPE_LABELS: Record<Ad["ad_type"], string> = {
  fast: "Fast ad",
  independent: "Independent",
  agency: "Agency",
};

const CATEGORY_LABELS: Record<string, string> = {
  announcement: "Announcement",
  event: "Event",
  business: "Business",
  service: "Service",
  companion: "Companion",
};

function whatsappHref(code?: string, number?: string): string | null {
  if (!number) return null;
  const digits = `${code ?? ""}${number}`.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function telegramHref(handle?: string): string | null {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "").trim();
  if (!clean) return null;
  return `https://t.me/${clean}`;
}

export default function AdDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadAdBySlug(slug).then((result) => {
      if (!cancelled) {
        setAd(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center justify-center px-5 py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-[#d3444d]" />
      </main>
    );
  }

  if (!ad) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d3444d]">Advertisement</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">This ad is no longer available</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          The placement may have expired or been removed. Browse the directory or post your own ad instead.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <Link href="/advertise" className="inline-flex items-center rounded-xl bg-[#d3444d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ad3039]">
            Post an ad
          </Link>
        </div>
      </main>
    );
  }

  const location = [ad.neighborhood, ad.city].filter(Boolean).join(", ");
  const waHref = whatsappHref(ad.contact_whatsapp_code, ad.contact_whatsapp_number);
  const tgHref = telegramHref(ad.contact_telegram);
  const gallery = ad.images.length ? ad.images : ad.cover_image ? [ad.cover_image] : [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to browsing
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-neutral-900">
            {gallery.length > 0 ? (
              <Image
                src={gallery[0]}
                alt={ad.title}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-500">
                <Crown className="h-10 w-10" />
              </div>
            )}
            <CountryFlagBadge country={ad.country} />
            {ad.is_featured && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#e5b34c]/40 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ffe5a3] backdrop-blur sm:left-4 sm:top-4 sm:text-[10px]">
                <Crown className="h-3 w-3" /> Admin featured
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {gallery.slice(0, 8).map((src, index) => (
                <div key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-neutral-900">
                  <Image src={src} alt={`${ad.title} media ${index + 1}`} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-[#d3444d]/10 px-3 py-1 text-[#d3444d]">{AD_TYPE_LABELS[ad.ad_type]}</span>
            {ad.category && <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{CATEGORY_LABELS[ad.category] ?? ad.category}</span>}
            {ad.featured_tier && <span className="rounded-full bg-amber-300/15 px-3 py-1 text-amber-600 dark:text-amber-300 capitalize">{ad.featured_tier}</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{ad.title}</h1>
          {ad.summary_line && <p className="mt-3 text-base leading-7 text-muted-foreground">{ad.summary_line}</p>}
          {location && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-[#d3444d]" /> {location}
            </p>
          )}

          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">About this ad</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground">{ad.description}</p>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white transition hover:brightness-95">
                <Phone className="h-4 w-4" /> Contact on WhatsApp
              </a>
            )}
            {tgHref && (
              <a href={tgHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 text-sm font-bold text-white transition hover:brightness-95">
                <Send className="h-4 w-4" /> Message on Telegram
              </a>
            )}
          </div>

          {ad.links.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {ad.links.map((link, index) => (
                <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted">
                  <ExternalLink className="h-3.5 w-3.5" /> {link.label}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
