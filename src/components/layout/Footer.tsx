"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, FileText, Send, Mail, HelpCircle, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const pageLinks = [
  { key: "privacy", href: "/privacy", label: "Privacy Policy", icon: Shield },
  { key: "terms", href: "/terms", label: "Terms and Conditions", icon: FileText },
  { key: "faqs", href: "/faqs", label: "FAQs", icon: HelpCircle },
  { key: "disclaimer", href: "/disclaimer", label: "Disclaimer", icon: TriangleAlert },
] as const;

export function Footer() {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const loadLabels = async () => {
      const { data, error } = await client
        .from("site_pages")
        .select("page_key,title");
      if (error) {
        console.error("Could not load admin-edited footer page titles:", error.message);
        return;
      }
      if (!cancelled) {
        setLabels(Object.fromEntries((data ?? []).map((page) => [page.page_key, page.title])));
      }
    };
    void loadLabels();
    const channel = client
      .channel("footer-site-page-labels")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_pages" }, () => {
        void loadLabels();
      })
      .subscribe();
    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, []);

  return (
    <footer
      className="relative isolate mt-10 overflow-hidden border-t border-white/10 bg-[#090909] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/footerbg.jpeg')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-b from-black/35 via-black/75 to-black" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-0 h-36 border-t border-white/10 bg-black/45 backdrop-blur-xl" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-10 text-sm text-foreground sm:px-8 md:flex-row md:items-end">
        <div className="max-w-md space-y-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.jpeg"
              alt="Honeybee"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <div className="font-display text-lg font-semibold tracking-tight">Honeybee</div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            A more thoughtful way to find trusted people and independent services across Uganda.
          </p>
          <p className="pt-1 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Honeybee. Strictly 18+. All rights reserved.
          </p>
        </div>

        <div className="flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium sm:text-sm">
          {pageLinks.map(({ key, href, label, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="inline-flex items-center gap-1.5 text-neutral-200 transition-colors hover:text-white hover:underline"
            >
              <Icon className="h-4 w-4" />
              {labels[key] || label}
            </Link>
          ))}
          <a
            href="https://t.me/honeybee"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-neutral-200 transition-colors hover:text-white hover:underline"
          >
            <Send className="h-4 w-4 text-sky-500" />
            Complaints on Telegram
          </a>
          <a
            href="mailto:support@honeybee.ug"
            className="inline-flex items-center gap-1.5 text-neutral-200 transition-colors hover:text-white hover:underline"
          >
            <Mail className="h-4 w-4" />
            support@honeybee.ug
          </a>
        </div>
      </div>
    </footer>
  );
}
