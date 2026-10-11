import React from "react";
import Link from "next/link";
import { Shield, FileText, Send, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative isolate min-h-64 overflow-hidden border-t border-border mt-16">
      {/* Background with blur effect matching original Honeybee style */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat blur-md opacity-40 dark:opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/images/footer_bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />

      <div className="relative mx-auto flex min-h-64 max-w-7xl flex-col justify-end gap-6 px-6 pb-8 pt-20 text-sm text-foreground md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="font-semibold text-base tracking-tight">Honeybee</div>
          <p className="text-xs text-muted-foreground">
            Uganda&apos;s verified platform for private specialists, culinary masters &amp; verified companions.
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            &copy; {new Date().getFullYear()} Honeybee. Strictly 18+. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-medium">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Terms of Service
          </Link>
          <a
            href="https://t.me/honeybee"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            <Send className="h-4 w-4 text-sky-500" />
            Complaints on Telegram
          </a>
          <a
            href="mailto:support@honeybee.ug"
            className="inline-flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            support@honeybee.ug
          </a>
        </div>
      </div>
    </footer>
  );
}
