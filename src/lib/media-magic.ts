/**
 * Magic-byte sniffing for uploaded originals.
 *
 * Extension and Content-Type are client-supplied; the leading bytes are the
 * only trustworthy format evidence before the processing pipeline decodes the
 * file. The queue consumer repeats the check on full decode failure.
 */

export type SniffedFormat = "jpg" | "png" | "webp" | null;

export function sniffImageFormat(bytes: Uint8Array): SniffedFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function sniffVideoFormat(bytes: Uint8Array): SniffedFormat | "mp4" | "mov" | "webm" {
  // ftyp ISO-BMFF box within the first 12 bytes: mp4 and QuickTime share it,
  // the brand at offset 8 separates them.
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === "ftyp"
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    return brand === "qt  " ? "mov" : "mp4";
  }
  // Matroska/WebM EBML header.
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "webm";
  }
  return null;
}

/** `true` when the sniffed format is one the policy accepts for the kind. */
export function isAllowedDetectedFormat(
  kind: "photo" | "video",
  allowedFormats: string[],
  bytes: Uint8Array
): boolean {
  const detected = kind === "photo" ? sniffImageFormat(bytes) : sniffVideoFormat(bytes);
  if (!detected) return false;
  const normalised = allowedFormats.map((format) => format.toLowerCase());
  if (detected === "jpg") return normalised.includes("jpg") || normalised.includes("jpeg");
  return normalised.includes(detected);
}
