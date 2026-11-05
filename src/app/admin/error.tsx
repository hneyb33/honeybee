"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure to the console so it can be picked up by any
    // client-side error reporter. We intentionally do NOT throw.
    console.error("[admin]", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold">Something went wrong in this admin section</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The rest of the dashboard is still safe to use. Retry this section, or navigate away using
        the sidebar.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">digest: {error.digest}</p>
      )}
      <div className="mt-5 flex gap-2">
        <Button onClick={reset} className="rounded-xl">
          Retry section
        </Button>
        <Button variant="outline" onClick={reset} className="rounded-xl">
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
