"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, RefreshCw, Video, X } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listingsMutations } from "@/lib/admin/mutations";
import { fetchPendingListingsWithMedia, type AdminListingRow, type AdminListingMediaRow } from "@/lib/admin/queries";
import { can } from "@/lib/admin/permissions";
import { useAdminSession } from "@/lib/admin/session";
import {
  getMediaImageUrl,
  getMediaThumbnailUrl,
  getMediaVideoUrl,
} from "@/lib/media-urls";

interface PendingListing extends AdminListingRow {
  media: AdminListingMediaRow[];
}

/**
 * Media-heavy review queue for pending and under-review listings. This is the
 * promoted successor of the previous "verifications" tab in the old single-page
 * dashboard, with the same optimistic verify/reject flow.
 */
export function VerificationQueue() {
  const { role } = useAdminSession();
  const [rows, setRows] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchPendingListingsWithMedia();
    setRows(result.rows as PendingListing[]);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, status: string, notes?: string | null) => {
    setBusyId(id);
    setError(null);
    const result = await listingsMutations.moderate(id, status, notes ?? null);
    if (!result.ok) setError(result.error ?? "Action failed.");
    else await load();
    setBusyId(null);
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-3 rounded-2xl p-10 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading verification queue…
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AdminCard
        title={`Verification queue (${rows.length})`}
        description="Profiles awaiting moderation. Verify to publish, reject with a reason to notify the owner."
        actions={
          <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        }
      >
        {error ? (
          <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No profiles are waiting for review.
          </p>
        ) : null}
      </AdminCard>

      {rows.map((listing) => (
        <Card key={listing.id} className="rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {listing.cover_image ? (
                  <Image
                    src={getMediaImageUrl({ url: listing.cover_image }, "card") || listing.cover_image}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-bold">{listing.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {listing.kind === "service" ? "Service provider" : "Model"} · {listing.category ?? "—"} ·{" "}
                  {listing.neighborhood ?? "—"}, {listing.city ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(listing.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={listing.verification_status} />
              <Link
                href={`/profiles/${listing.slug}`}
                target="_blank"
                className="text-xs text-muted-foreground hover:underline"
              >
                Preview
              </Link>
              {can(role, "verifications.review") ? (
                <>
                  <Button
                    disabled={busyId === listing.id}
                    onClick={() => void act(listing.id, "verified")}
                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    size="sm"
                  >
                    <Check className="mr-1 h-4 w-4" /> Verify
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busyId === listing.id}
                    size="sm"
                    onClick={() => {
                      const notes = window.prompt("Reason for rejection (at least 8 characters):");
                      if (!notes || notes.length < 8) {
                        setError("Rejection reason must be at least 8 characters.");
                        return;
                      }
                      void act(listing.id, "rejected", notes);
                    }}
                    className="rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {listing.media.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5 sm:grid-cols-4 lg:grid-cols-6">
              {listing.media.map((media) => (
                <div
                  key={media.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black"
                >
                  {media.kind === "video" ? (
                    <>
                      <video
                        src={getMediaVideoUrl(media)}
                        poster={getMediaThumbnailUrl(media) ?? undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                        aria-label={`Profile video for ${listing.title}`}
                      />
                      <Video className="absolute right-2 top-2 h-3 w-3 text-white/80" />
                    </>
                  ) : (
                    <Image
                      src={getMediaImageUrl(media, "detail")}
                      alt={`Profile photo for ${listing.title}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  <Badge variant="secondary" className="absolute left-2 top-2 capitalize">
                    {media.kind}
                  </Badge>
                  {media.storage_provider === "cloudinary" &&
                    media.processing_status !== "ready" && (
                      <Badge
                        variant="outline"
                        className="absolute bottom-2 left-2 border-amber-400 bg-amber-100 text-amber-950"
                      >
                        Processing
                      </Badge>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              No portfolio media submitted.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
