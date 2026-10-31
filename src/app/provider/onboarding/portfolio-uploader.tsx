"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Copy,
  ImagePlus,
  LoaderCircle,
  RotateCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MEDIA_ACCEPT_ATTRIBUTE, MEDIA_POLICY } from "@/lib/media-policy";
import type { PortfolioMedia } from "@/lib/media-records";
import { isMediaReady } from "@/lib/media-records";
import type { QueueItem, PortfolioQueue } from "./use-portfolio-queue";

/**
 * The portfolio step's media control. Replaces the old single progress bar with
 * a per-file queue: each chosen photo or video uploads on its own, shows its own
 * progress, and can be retried or cancelled independently.
 */
export function PortfolioUploader({
  queue,
  existingMedia,
  onRemoveExisting,
  disabled,
}: {
  queue: PortfolioQueue;
  existingMedia: PortfolioMedia[];
  onRemoveExisting: (media: PortfolioMedia) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selected = Array.from(input.files ?? []);
    input.value = "";
    if (selected.length === 0) return;
    const rejections = await queue.addFiles(selected);
    queue.setRejections(rejections);
  };

  const photoCount =
    existingMedia.filter((item) => item.kind === "photo").length + queue.pendingCount.photo;
  const videoCount =
    existingMedia.filter((item) => item.kind === "video").length + queue.pendingCount.video;

  // Media still waiting on Cloudinary: registered rows not yet ready plus queue
  // rows kept in "processing". Drives the friendly "Preparing" messaging.
  const preparingMedia = existingMedia.filter(
    (item) => item.storageProvider === "cloudinary" && !isMediaReady(item)
  );
  const preparingQueue = queue.items.filter((item) => item.status === "processing");
  const preparingVideos =
    preparingMedia.filter((item) => item.kind === "video").length +
    preparingQueue.filter((item) => item.kind === "video").length;
  const preparingPhotos =
    preparingMedia.filter((item) => item.kind === "photo").length +
    preparingQueue.filter((item) => item.kind === "photo").length;
  const preparingCount = preparingVideos + preparingPhotos;

  return (
    <div className="space-y-3">
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center transition hover:border-airbnb-coral"
        onDragOver={(event) => event.preventDefault()}
      >
        <ImagePlus className="mb-2 h-7 w-7 text-airbnb-coral" />
        <span className="text-sm font-semibold">Choose photos and videos</span>
        <span className="mt-1 text-xs text-muted-foreground">
          Uploads start as soon as you pick a file.
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(event) => void pick(event)}
        />
      </label>

      {queue.rejections.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
        >
          <div className="flex items-start justify-between gap-2">
            <ul className="list-disc space-y-0.5 pl-4">
              {queue.rejections.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <button
              type="button"
              aria-label="Dismiss messages"
              onClick={() => queue.setRejections([])}
              className="shrink-0 text-destructive/70 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {preparingCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold">
              Preparing your {preparingVideos > 0 ? "video" : "photo"}
              {preparingVideos > 0 && preparingPhotos > 0 ? " and photo" : ""}
              {preparingCount > 1 ? "s" : ""}{"\u2026"}
            </p>
            <p className="mt-0.5">
              Cloudinary is optimising {preparingCount} item{preparingCount > 1 ? "s" : ""} so {preparingCount > 1 ? "they" : "it"} load
              fast for clients. This usually finishes within a minute and updates here on its own {"\u2014"} you can
              keep going.
            </p>
          </div>
        </div>
      )}

      {queue.items.length > 0 && (
        <ul className="space-y-2">
          {queue.items.map((item) => (
            <QueueRow key={item.id} item={item} queue={queue} />
          ))}
        </ul>
      )}

      {(existingMedia.length > 0 || queue.items.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existingMedia.map((item, index) => (
            <div key={item.id ?? item.url} className="relative aspect-square overflow-hidden rounded-xl bg-black">
              {item.kind === "video" ? (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  aria-label={`Portfolio video ${index + 1}`}
                />
              ) : (
                <Image
                  src={item.cardUrl ?? item.url}
                  alt={`Portfolio photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
              {item.kind === "photo" && index === 0 && (
                <Badge className="absolute left-1 top-1 text-[10px]">Cover</Badge>
              )}
              {item.storageProvider === "cloudinary" && !isMediaReady(item) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/65 p-2 text-center text-white">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <span className="text-[10px] font-semibold leading-tight">
                    Preparing your {item.kind === "video" ? "video" : "photo"}
                  </span>
                </div>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${item.kind} ${index + 1}`}
                onClick={() => onRemoveExisting(item)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-black disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {photoCount}/{MEDIA_POLICY.photo.maxCount} photos · {videoCount}/{MEDIA_POLICY.video.maxCount} videos
      </p>
    </div>
  );
}

function QueueRow({ item, queue }: { item: QueueItem; queue: PortfolioQueue }) {
  const previewUrl = queue.previewFor(item.id);
  const busy =
    item.status === "queued" ||
    item.status === "compressing" ||
    item.status === "uploading" ||
    item.status === "registering";

  return (
    <li className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
      <div className="flex items-center gap-3">
        {previewUrl && item.kind === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10">
            <UploadCloud className="h-4 w-4 text-muted-foreground" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 font-medium">
              {busy && <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-airbnb-coral" />}
              {item.status === "failed" && <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              {item.status === "processing" && <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-airbnb-coral" />}
              <span className="truncate">{item.file.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {item.status === "processing" ? "Preparing" : busy ? `${item.progress}%` : labelFor(item.status)}
            </span>
          </div>

          {busy && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-airbnb-coral transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}

          {item.savedBytes ? (
            <p className="mt-1 text-[11px] text-emerald-600">
              Optimised in your browser, saved {(item.savedBytes / 1000).toFixed(0)} KB.
            </p>
          ) : null}

          {item.status === "failed" && (
            <div className="mt-1.5 space-y-1.5">
              <p className="text-destructive">{item.error}</p>
              {item.errorDetail && (
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(item.errorDetail ?? "").catch(() => undefined)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" /> Copy technical detail
                </button>
              )}
              <div className="flex gap-2">
                {item.retryable && (
                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => queue.retry(item.id)}>
                    <RotateCw className="mr-1 h-3 w-3" /> Retry
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => queue.cancel(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Remove
                </Button>
              </div>
            </div>
          )}

          {busy && (
            <button
              type="button"
              onClick={() => queue.cancel(item.id)}
              className="mt-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function labelFor(status: QueueItem["status"]): string {
  switch (status) {
    case "compressing":
      return "Optimising";
    case "uploading":
      return "Uploading";
    case "registering":
      return "Finalising";
    case "failed":
      return "Failed";
    default:
      return "";
  }
}
