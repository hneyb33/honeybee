import { z } from "zod";

type CloudinaryResourceType = "image" | "video";

const signatureSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int(),
  params: z.record(z.union([z.string(), z.number()])),
  signature: z.string().min(1),
  resourceType: z.enum(["image", "video"]),
  publicId: z.string().min(1),
});

const uploadResultSchema = z.object({
  public_id: z.string().min(1),
  asset_id: z.string().min(1).max(128),
});

const finalizedMediaSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  url: z.string().url(),
  kind: z.enum(["photo", "video"]),
  sort_order: z.number().int(),
  thumbnail_url: z.string().url().nullable(),
  processing_status: z.enum(["pending", "processing", "ready", "failed"]),
  cloudinary_public_id: z.string().nullable().optional(),
  cloudinary_asset_id: z.string().nullable().optional(),
});

export type UploadedCloudinaryAsset = {
  publicId: string;
  assetId: string;
  kind: CloudinaryResourceType;
};

export type RegisteredCloudinaryMedia = z.infer<typeof finalizedMediaSchema>;

type UploadSignature = z.infer<typeof signatureSchema>;

const CHUNKED_UPLOAD_THRESHOLD = 100_000_000;
const CHUNK_SIZE = 20 * 1024 * 1024;
const PROCESSING_POLL_INTERVAL_MS = 3000;
const MAX_PROCESSING_POLL_INTERVAL_MS = 15000;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

async function responseError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      return body.error.message;
    }
  } catch {
    return `Cloudinary request failed (${response.status}).`;
  }
  return `Cloudinary request failed (${response.status}).`;
}

function uploadChunk(
  file: File,
  signature: UploadSignature,
  start: number,
  end: number,
  uploadId: string | null,
  onProgress: (loaded: number) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file.slice(start, end + 1), file.name);
    form.append("api_key", signature.apiKey);
    form.append("signature", signature.signature);
    for (const [key, value] of Object.entries(signature.params)) {
      form.append(key, String(value));
    }

    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${signature.resourceType}/upload`
    );
    if (uploadId) {
      request.setRequestHeader("X-Unique-Upload-Id", uploadId);
      request.setRequestHeader("Content-Range", `bytes ${start}-${end}/${file.size}`);
    }
    request.upload.onprogress = (event) => {
      onProgress(start + (event.lengthComputable ? event.loaded : 0));
    };
    request.onerror = () => reject(new Error("Could not reach Cloudinary. Check your connection and try again."));
    request.onabort = () => reject(new Error("The Cloudinary upload was cancelled."));
    request.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Cloudinary returned an invalid upload response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        const cloudinaryMessage =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          payload.error &&
          typeof payload.error === "object" &&
          "message" in payload.error &&
          typeof payload.error.message === "string"
            ? payload.error.message
            : `Cloudinary upload failed (${request.status}).`;
        reject(new Error(cloudinaryMessage));
        return;
      }
      resolve(payload);
    };
    request.send(form);
  });
}

export async function uploadMediaToCloudinary(
  file: File,
  kind: CloudinaryResourceType,
  listingId: string,
  accessToken: string,
  onProgress: (percent: number) => void
): Promise<UploadedCloudinaryAsset> {
  const signatureResponse = await fetch("/api/media/signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ listingId, kind }),
  });
  if (!signatureResponse.ok) {
    throw new Error(await responseError(signatureResponse));
  }

  let signaturePayload: unknown;
  try {
    signaturePayload = await signatureResponse.json();
  } catch {
    throw new Error("The upload authorization response is invalid.");
  }
  const signatureResult = signatureSchema.safeParse(signaturePayload);
  if (!signatureResult.success) {
    throw new Error("The upload authorization response is invalid.");
  }
  const signature = signatureResult.data;
  let result: unknown;

  if (file.size > CHUNKED_UPLOAD_THRESHOLD) {
    const uploadId = crypto.randomUUID();
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size) - 1;
      result = await uploadChunk(file, signature, start, end, uploadId, (loaded) => {
        onProgress(Math.min(100, Math.round((loaded / file.size) * 100)));
      });
      start = end + 1;
    }
  } else {
    result = await uploadChunk(file, signature, 0, file.size - 1, null, (loaded) => {
      onProgress(Math.min(100, Math.round((loaded / file.size) * 100)));
    });
  }

  const uploadResult = uploadResultSchema.safeParse(result);
  if (
    !uploadResult.success ||
    uploadResult.data.public_id !== signature.publicId
  ) {
    throw new Error("Cloudinary did not confirm the authorized upload.");
  }

  return {
    publicId: uploadResult.data.public_id,
    assetId: uploadResult.data.asset_id,
    kind,
  };
}

export async function finalizeCloudinaryMedia(
  listingId: string,
  asset: UploadedCloudinaryAsset,
  accessToken: string,
  onProcessing?: (media: RegisteredCloudinaryMedia) => void
): Promise<RegisteredCloudinaryMedia> {
  const deadline = Date.now() + PROCESSING_TIMEOUT_MS;
  let pollInterval = PROCESSING_POLL_INTERVAL_MS;
  while (true) {
    const response = await fetch("/api/media/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        listingId,
        kind: asset.kind,
        publicId: asset.publicId,
        assetId: asset.assetId,
      }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (response.status === 202) {
      const pendingResult = z.object({ media: finalizedMediaSchema }).safeParse(payload);
      if (!pendingResult.success) {
        throw new Error("Cloudinary returned an invalid processing status.");
      }
      onProcessing?.(pendingResult.data.media);
      if (Date.now() >= deadline) {
        throw new Error("Cloudinary is still preparing the video. Save again in a few minutes to check its status.");
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      pollInterval = Math.min(
        Math.round(pollInterval * 1.5),
        MAX_PROCESSING_POLL_INTERVAL_MS
      );
      continue;
    }
    if (!response.ok) {
      throw new Error(await responseError(
        new Response(JSON.stringify(payload), { status: response.status })
      ));
    }

    const finalizedResult = z.object({ media: finalizedMediaSchema }).safeParse(payload);
    if (!finalizedResult.success) {
      throw new Error("Cloudinary returned an invalid finalized media record.");
    }
    return finalizedResult.data.media;
  }
}
