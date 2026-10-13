import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, FileText, Send, Mail, HelpCircle, ShieldAlert, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-neutral-800 bg-[#090909]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-10 text-sm text-foreground sm:px-8 md:flex-row md:items-end">
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

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium sm:text-sm">
          <Link
            href="/faqs"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <HelpCircle className="h-4 w-4" />
            FAQs
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <Shield className="h-4 w-4" />
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <FileText className="h-4 w-4" />
            Terms of Service
          </Link>
          <Link
            href="/disclaimer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <ShieldAlert className="h-4 w-4" />
            Disclaimer
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Contact
          </Link>
          <a
            href="https://t.me/honeybee"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <Send className="h-4 w-4 text-sky-500" />
            Complaints on Telegram
          </a>
          <a
            href="mailto:support@honeybee.ug"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <Mail className="h-4 w-4" />
            support@honeybee.ug
          </a>
        </div>
      </div>
    </footer>
  );
}
