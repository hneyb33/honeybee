"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  finalizeCloudinaryMedia,
  uploadMediaToCloudinary,
  type RegisteredCloudinaryMedia,
} from "@/lib/cloudinary-upload";
import { MediaUploadError, isAbortError } from "@/lib/media-errors";
import { abandonMedia, refreshPendingMedia } from "@/lib/media-lifecycle";
import { compressImageForUpload } from "@/lib/media-compress";
import { getVideoDuration } from "@/lib/media-inspect";
import {
  MEDIA_KINDS,
  MEDIA_POLICY,
  describeMediaRejection,
  formatBytes,
  type MediaKind,
} from "@/lib/media-policy";
import type { PortfolioMedia } from "@/lib/media-records";
import { isMediaReady } from "@/lib/media-records";

/**
 * Upload queue for the provider portfolio.
 *
 * The wizard used to hold files in a plain list and push them to Cloudinary only
 * when "Save & continue" was pressed, so a provider watched one serial progress
 * bar for minutes with no way to stop or retry a single file. Here every chosen
 * file becomes a queue item that starts uploading immediately, reports its own
 * progress, can be cancelled or retried on its own, and keeps the technical
 * detail of a failure for support.
 */

export type QueueStatus =
  | "queued"
  | "compressing"
  | "uploading"
  | "registering"
  | "processing"
  | "failed";

export interface QueueItem {
  id: string;
  file: File;
  kind: MediaKind;
  status: QueueStatus;
  progress: number;
  publicId?: string;
  assetId?: string;
  error?: string;
  errorDetail?: string;
  retryable?: boolean;
  savedBytes?: number;
}

export interface PortfolioQueueOptions {
  /** Called with a fresh Supabase access token; tokens expire mid-upload. */
  getAccessToken: () => Promise<string>;
  /** Creates (once) and returns the draft listing id an upload needs. */
  ensureListing: () => Promise<string | null>;
  /** Registers a finished media row in the wizard's portfolio state. */
  onRegistered: (media: RegisteredCloudinaryMedia) => void;
  /** Existing plus queued counts, used for pre-flight validation. */
  getCounts: () => Record<MediaKind, number>;
  /** Current listing id, if the draft has been created yet (for status polling). */
  getListingId: () => string | null;
}

let itemSequence = 0;

function nextItemId(): string {
  itemSequence += 1;
  return `media-${Date.now().toString(36)}-${itemSequence}`;
}

export function usePortfolioQueue(options: PortfolioQueueOptions) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Map<string, string>());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const write = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<QueueItem>) => {
      write(
        itemsRef.current.map((item) => (item.id === id ? { ...item, ...changes } : item))
      );
    },
    [write]
  );

  const drop = useCallback(
    (id: string) => {
      write(itemsRef.current.filter((item) => item.id !== id));
    },
    [write]
  );

  const previewFor = useCallback((id: string) => previews.current.get(id) ?? null, []);

  const runItem = useCallback(
    async (item: QueueItem) => {
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      const listingId = await optionsRef.current.ensureListing();
      if (!listingId) {
        patch(item.id, {
          status: "failed",
          error: "Your profile draft could not be created, so the upload did not start.",
          retryable: true,
        });
        controllers.current.delete(item.id);
        return;
      }
      const accessToken = await optionsRef.current.getAccessToken();

      // Keep a local handle: a compressed photo replaces the file the user chose.
      let file = item.file;
      try {
        if (item.kind === "photo" && file.size > 1_500_000) {
          patch(item.id, { status: "compressing", progress: 0 });
          const compressed = await compressImageForUpload(file);
          if (compressed.file !== file) {
            file = compressed.file;
            patch(item.id, { savedBytes: compressed.savedBytes });
            const previousUrl = previews.current.get(item.id);
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            previews.current.set(item.id, URL.createObjectURL(file));
          }
        }

        patch(item.id, { status: "uploading", progress: 0 });
        const uploaded = await uploadMediaToCloudinary(
          file,
          item.kind,
          listingId,
          accessToken,
          {
            signal: controller.signal,
            onProgress: (percent) => patch(item.id, { progress: percent }),
          }
        );
        patch(item.id, {
          status: "registering",
          progress: 100,
          publicId: uploaded.publicId,
          assetId: uploaded.assetId,
        });

        // Registration is where a refusal from Cloudinary or the finalize route
        // surfaces. The asset ids stay on the item so "Retry" skips the upload
        // instead of paying for the bytes twice.
        const media = await finalizeCloudinaryMedia(listingId, uploaded, accessToken, {
          signal: controller.signal,
        });
        patch(item.id, { status: "processing" });
        optionsRef.current.onRegistered(media);
        if (media.processing_status === "ready" || media.kind === "photo") {
          drop(item.id);
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          drop(item.id);
          return;
        }
        const mediaError = error instanceof MediaUploadError ? error : null;
        patch(item.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "The upload failed unexpectedly.",
          errorDetail: mediaError?.detail ?? "",
          retryable: mediaError ? mediaError.retryable || mediaError.status === null : false,
        });
      } finally {
        controllers.current.delete(item.id);
      }
    },
    [drop, patch]
  );

  const addFiles = useCallback(
    async (selected: File[]): Promise<string[]> => {
      const rejections: string[] = [];
      const additions: QueueItem[] = [];
      const counts: Record<MediaKind, number> = { ...optionsRef.current.getCounts() };

      for (const file of selected) {
        const kind = MEDIA_KINDS.find((candidate) =>
          MEDIA_POLICY[candidate].allowedMimeTypes.includes(file.type)
        );
        if (!kind) {
          rejections.push(
            `${file.name}: choose a JPEG, PNG or WebP photo, or an MP4, WebM or QuickTime video.`
          );
          continue;
        }

        let durationSeconds: number | undefined;
        if (kind === "video") {
          try {
            durationSeconds = await getVideoDuration(file);
          } catch {
            // An unreadable duration is not a reason to refuse the file - many
            // valid QuickTime/WebM clips report no duration in the browser. The
            // finalize route always re-checks duration server-side, so leave it
            // undefined and let the upload proceed rather than punishing the user.
            durationSeconds = undefined;
          }
        }

        counts[kind] += 1;
        const reason = describeMediaRejection(file, counts, { videoDurationSeconds: durationSeconds });
        if (reason) {
          counts[kind] -= 1;
          rejections.push(`${file.name}: ${reason}`);
          continue;
        }

        const id = nextItemId();
        previews.current.set(id, URL.createObjectURL(file));
        additions.push({ id, file, kind, status: "queued", progress: 0 });
      }

      if (additions.length > 0) {
        write([...itemsRef.current, ...additions]);
        // Every chosen file starts on its own, so one slow clip never blocks the
        // photos behind it.
        additions.forEach((item) => void runItem(item));
      }
      return rejections;
    },
    [runItem, write]
  );

  const retry = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item || item.status !== "failed") return;
      patch(id, { status: "queued", error: undefined, errorDetail: undefined, progress: 0 });
      void runItem({ ...item, status: "queued", error: undefined, errorDetail: undefined });
    },
    [patch, runItem]
  );

  const cancel = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      // Bytes already at Cloudinary must be removed, or the slot stays taken.
      if (item?.publicId) {
        void optionsRef.current
          .getAccessToken()
          .then((token) => abandonMedia(item.publicId as string, token))
          .catch(() => undefined);
      }
      drop(id);
    },
    [drop]
  );

  /** Removes a queued file without touching Cloudinary. */
  const discard = useCallback(
    (id: string) => {
      drop(id);
    },
    [drop]
  );

  const hasActiveUploads = items.some((item) =>
    item.status === "queued" ||
    item.status === "compressing" ||
    item.status === "uploading" ||
    item.status === "registering"
  );

  const failedCount = items.filter((item) => item.status === "failed").length;

  const pendingCount = useMemo(
    () => ({
      photo: items.filter((item) => item.kind === "photo").length,
      video: items.filter((item) => item.kind === "video").length,
    }),
    [items]
  );

  // A video that outlived the grace period keeps the "Processing" badge until
  // Cloudinary confirms the transcode, so pending rows are re-checked on a timer.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const poll = async () => {
      const listingId = optionsRef.current.getListingId();
      if (listingId) {
        try {
          const token = await optionsRef.current.getAccessToken();
          const refreshed = await refreshPendingMedia(listingId, token);
          refreshed.forEach((media) => optionsRef.current.onRegistered(media));
        } catch {
          // A failed poll is not worth interrupting the wizard for.
        }
      }
      if (!stopped) timer = setTimeout(poll, 20000);
    };

    timer = setTimeout(poll, 20000);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(
    () => () => {
      controllers.current.forEach((controller) => controller.abort());
      controllers.current.clear();
      previews.current.forEach((url) => URL.revokeObjectURL(url));
      previews.current.clear();
    },
    []
  );

  return {
    items,
    rejections,
    setRejections,
    addFiles,
    retry,
    cancel,
    discard,
    hasActiveUploads,
    failedCount,
    pendingCount,
    previewFor,
    /** Photos still to come are resized in the browser before they are sent. */
    budgetFor: (kind: MediaKind) => formatBytes(MEDIA_POLICY[kind].uploadBudgetBytes),
    isReady: isMediaReady,
  };
}

export type PortfolioQueue = ReturnType<typeof usePortfolioQueue>;
