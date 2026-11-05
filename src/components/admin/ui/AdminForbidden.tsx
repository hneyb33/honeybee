"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Renders a friendly permission notice for admin pages the caller's role
 * cannot open. Uses `capability` only as a display hint (e.g. "billing.edit").
 */
export function AdminForbidden({ capability }: { capability?: string }) {
  return (
    <Card className="mx-auto max-w-xl rounded-2xl p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40">
        <ShieldX className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold">Restricted section</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your admin role does not grant access to this area
        {capability ? <> (<code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">{capability}</code>)</> : null}.
        Ask a super admin if you need it.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    </Card>
  );
}
