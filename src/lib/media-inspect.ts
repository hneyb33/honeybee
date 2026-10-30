/**
 * Browser media inspection helpers.
 *
 * Reading a video's duration was previously coded inline in the onboarding
 * wizard; the admin listing editor needs the same check, so it lives here.
 */

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Video duration can only be checked in the browser."));
      return;
    }
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      cleanup();
      if (Number.isFinite(video.duration) && video.duration > 0) {
        resolve(video.duration);
      } else {
        reject(new Error("Could not read that video's duration. Try an H.264 MP4 file."));
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read that video's duration. Try an H.264 MP4 file."));
    };
    // Some browsers never fire either event for a codec they cannot decode.
    setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error("Timed out while reading that video's duration. Try an H.264 MP4 file."));
      }
    }, 15000);
    video.src = objectUrl;
  });
}
