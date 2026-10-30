/**
 * Client-side image pre-processing.
 *
 * A phone camera produces 6-12 MB JPEGs, which is slow on a mobile uplink and
 * sits right on top of Cloudinary's per-file limit. Downsizing before upload
 * keeps every photo well inside the budget, uploads in seconds instead of
 * minutes, and costs nothing on the server. Videos are left alone: re-encoding
 * them in the browser is not practical, so Cloudinary does the transcoding.
 */

const MAX_EDGE = 2000;
const TARGET_BYTES = 6 * 1000 * 1000;
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.6];

function supportsCompression(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.toBlob === "function"
  );
}

function toJpegName(name: string): string {
  return name.replace(/\.(webp|png|jpe?g)$/i, "") + ".jpg";
}

export interface CompressResult {
  file: File;
  savedBytes: number;
}

/**
 * Returns a smaller JPEG rendition when one can be produced, otherwise the
 * original file. Never throws: a compression failure must not block an upload.
 */
export async function compressImageForUpload(file: File): Promise<CompressResult> {
  if (!supportsCompression() || !file.type.startsWith("image/")) {
    return { file, savedBytes: 0 };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close?.();
      return { file, savedBytes: 0 };
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    for (const quality of QUALITY_STEPS) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob) continue;
      if (blob.size < file.size && (blob.size <= TARGET_BYTES || quality === QUALITY_STEPS[QUALITY_STEPS.length - 1])) {
        const compressed = new File([blob], toJpegName(file.name), {
          type: "image/jpeg",
          lastModified: file.lastModified,
        });
        return { file: compressed, savedBytes: Math.max(0, file.size - compressed.size) };
      }
    }
    return { file, savedBytes: 0 };
  } catch {
    return { file, savedBytes: 0 };
  }
}
