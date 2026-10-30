"use client";

import { useState } from "react";
import { Activity, CopyCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { MEDIA_POLICY, formatBytes } from "@/lib/media-policy";

interface DiagnosticsReport {
  generatedAt?: string;
  verdict?: string;
  recommendations?: string[];
  environment?: {
    present: Record<string, boolean>;
    warnings: string[];
    maskedCloudName: string | null;
  };
  ping?: { ok: boolean; status?: number; data?: unknown; error?: string };
  usage?: { ok: boolean; status?: number; data?: unknown; error?: string };
  uploadTest?: {
    ok: boolean;
    status?: number;
    data?: { public_id?: string; bytes?: number; format?: string };
    error?: string;
    cldError?: string | null;
  };
  cleanup?: { ok: boolean; publicId: string };
  error?: string;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "secondary" : "destructive"} className="text-[10px]">
      {ok ? "PASS" : "FAIL"} · {label}
    </Badge>
  );
}

/** Summarises Cloudinary's `/usage` payload without assuming its exact shape. */
function usageLines(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const resources = (data as { resources?: unknown }).resources;
  if (!Array.isArray(resources)) return [];
  return resources
    .map((resource) => {
      const entry = resource as { type?: string; usage?: Array<{ credits?: number; usage?: number }> };
      const latest = Array.isArray(entry.usage) ? entry.usage[entry.usage.length - 1] : undefined;
      if (!entry.type || !latest) return null;
      const credits = typeof latest.credits === "number" ? `${latest.credits.toFixed(1)} credits` : "n/a";
      const absolute = typeof latest.usage === "number" ? formatBytes(latest.usage) : "n/a";
      return `${entry.type}: ${credits} used · ${absolute}`;
    })
    .filter((line): line is string => Boolean(line));
}

export function AdminMediaDiagnostics() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    const client = supabase;
    if (!client) {
      setError("Supabase is not configured, so the diagnostic cannot authenticate.");
      return;
    }
    setRunning(true);
    setError("");
    setReport(null);
    const { data, error: sessionError } = await client.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      setError(sessionError?.message ?? "Sign in again before running the diagnostic.");
      setRunning(false);
      return;
    }
    try {
      const response = await fetch("/api/media/diagnostics", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as DiagnosticsReport | null;
      if (!response.ok) {
        setError(payload?.error ?? `The diagnostic request failed (HTTP ${response.status}).`);
      } else {
        setReport(payload);
      }
    } catch {
      setError("Could not reach the media diagnostic endpoint. Check your connection.");
    } finally {
      setRunning(false);
    }
  };

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The browser blocked clipboard access. Screenshot the panel instead.");
    }
  };

  return (
    <Card className="space-y-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">Media pipeline test</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Runs Honeybee&apos;s real signing code and uploads a 1&nbsp;KB test image to Cloudinary,
            then deletes it. If this fails, no provider can upload photos or videos - the exact
            Cloudinary message is reported below.
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={running} className="rounded-xl">
          {running ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          {running ? "Testing" : "Run pipeline test"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {report && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              report.uploadTest?.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            }`}
          >
            <p className="font-semibold">{report.verdict}</p>
            {report.recommendations && report.recommendations.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {report.recommendations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <StatusPill ok={Boolean(report.environment && Object.values(report.environment.present).every(Boolean))} label="environment" />
            <StatusPill ok={Boolean(report.ping?.ok)} label="cloudinary ping" />
            <StatusPill ok={Boolean(report.usage?.ok)} label="usage limits" />
            <StatusPill ok={Boolean(report.uploadTest?.ok)} label="signed upload" />
            {report.uploadTest?.ok && <StatusPill ok={Boolean(report.cleanup?.ok)} label="cleanup" />}
          </div>

          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <dt className="font-semibold">Cloud name</dt>
              <dd className="mt-1 text-muted-foreground">{report.environment?.maskedCloudName ?? "not set"}</dd>
              {report.environment?.warnings.map((warning) => (
                <dd key={warning} className="mt-1 text-amber-600 dark:text-amber-400">{warning}</dd>
              ))}
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="font-semibold">Test upload</dt>
              <dd className="mt-1 break-all text-muted-foreground">
                {report.uploadTest?.ok
                  ? `${report.uploadTest.data?.public_id ?? "unknown"} · ${report.uploadTest.data?.format ?? "?"} · ${formatBytes(report.uploadTest.data?.bytes ?? 0)}`
                  : `HTTP ${report.uploadTest?.status ?? "?"} · ${report.uploadTest?.error ?? "failed"}${
                      report.uploadTest?.cldError ? ` · x-cld-error: ${report.uploadTest.cldError}` : ""
                    }`}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="font-semibold">Account</dt>
              <dd className="mt-1 text-muted-foreground">
                {report.ping?.ok
                  ? JSON.stringify(report.ping.data ?? {})
                  : report.ping?.error ?? "not checked"}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="font-semibold">Usage this period</dt>
              <dd className="mt-1 space-y-1 text-muted-foreground">
                {usageLines(report.usage?.data).length > 0
                  ? usageLines(report.usage?.data).map((line) => <div key={line}>{line}</div>)
                  : report.usage?.error ?? "not available"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              Current Honeybee limits: {MEDIA_POLICY.photo.maxCount} photos up to{" "}
              {formatBytes(MEDIA_POLICY.photo.uploadBudgetBytes)} · {MEDIA_POLICY.video.maxCount} videos up to{" "}
              {formatBytes(MEDIA_POLICY.video.uploadBudgetBytes)} and {Math.round((MEDIA_POLICY.video.maxDurationSeconds ?? 0) / 60)} min
            </span>
            <Button size="sm" variant="outline" onClick={copyReport} className="rounded-lg">
              <CopyCheck className="mr-2 h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy report"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
