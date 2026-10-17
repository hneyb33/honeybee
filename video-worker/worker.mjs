import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "honeybee-profile-media";
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 5000);
const maxBackoffMs = 60 * 60 * 1000;
const ffmpegTimeoutMs = 10 * 60 * 1000;
let stopping = false;

if (!supabaseUrl || !serviceRoleKey || !Number.isFinite(pollIntervalMs) || pollIntervalMs < 250) {
  throw new Error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a valid POLL_INTERVAL_MS.");
}

function encodedPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function storageUrl(path) {
  return `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath(path)}`;
}

function publicStorageUrl(path) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath(path)}`;
}

async function checkResponse(response, operation) {
  if (response.ok) return;
  const details = (await response.text()).slice(0, 2000);
  throw new Error(`${operation} failed (${response.status}): ${details || response.statusText}`);
}

async function claimJob() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/claim_profile_video_job`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  await checkResponse(response, "Claiming a video job");
  const jobs = await response.json();
  return jobs[0] ?? null;
}

async function updateMedia(mediaId, payload) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/profile_media?id=eq.${encodeURIComponent(mediaId)}&processing_status=eq.processing`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );
  await checkResponse(response, "Updating video processing status");
  return (await response.json()).length > 0;
}

async function downloadSource(sourcePath, destination) {
  const response = await fetch(storageUrl(sourcePath), {
    headers: { apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}` },
  });
  await checkResponse(response, "Downloading the original video");
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function uploadFile(path, filePath, contentType) {
  const response = await fetch(storageUrl(path), {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: await readFile(filePath),
  });
  await checkResponse(response, `Uploading ${contentType}`);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: "/tmp" },
    });
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), ffmpegTimeoutMs);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4000);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code ?? signal}: ${stderr.trim() || "no diagnostic output"}`));
    });
  });
}

async function makePoster(videoPath, posterPath) {
  const scale = "scale=640:-2:force_divisible_by=2";
  try {
    await runFfmpeg(["-ss", "1", "-protocol_whitelist", "file,pipe", "-i", videoPath, "-frames:v", "1", "-vf", scale, posterPath]);
  } catch {
    await runFfmpeg(["-protocol_whitelist", "file,pipe", "-i", videoPath, "-frames:v", "1", "-vf", scale, posterPath]);
  }
}

async function processJob(job) {
  const workDir = await mkdtemp(join(tmpdir(), "honeybee-video-"));
  const inputPath = join(workDir, "original");
  const outputPath = join(workDir, "playback.mp4");
  const posterPath = join(workDir, "poster.jpg");
  const outputBase = job.source_path.replace(/\.[^/.]+$/, "");
  const processedPath = `${outputBase}-processed.mp4`;
  const thumbnailPath = `${outputBase}-poster.jpg`;

  try {
    await downloadSource(job.source_path, inputPath);
    await runFfmpeg([
      "-protocol_whitelist", "file,pipe",
      "-i", inputPath,
      "-map", "0:v:0",
      "-map", "0:a:0?",
      "-vf", "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputPath,
    ]);
    await makePoster(outputPath, posterPath);
    await uploadFile(processedPath, outputPath, "video/mp4");
    await uploadFile(thumbnailPath, posterPath, "image/jpeg");

    const updated = await updateMedia(job.media_id, {
      url: publicStorageUrl(processedPath),
      processed_path: processedPath,
      thumbnail_url: publicStorageUrl(thumbnailPath),
      processing_status: "ready",
      processing_started_at: null,
      next_attempt_at: new Date().toISOString(),
      processing_error: null,
    });
    if (!updated) {
      console.warn(`Video job ${job.media_id} was no longer processing; uploaded outputs were not published.`);
      return;
    }
    console.info(`Processed video ${job.media_id} on attempt ${job.attempt_count}.`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function retryJob(job, error) {
  const backoff = Math.min(10_000 * (2 ** Math.min(job.attempt_count - 1, 16)), maxBackoffMs);
  const nextAttemptAt = new Date(Date.now() + backoff).toISOString();
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
  await updateMedia(job.media_id, {
    processing_status: "pending",
    processing_started_at: null,
    next_attempt_at: nextAttemptAt,
    processing_error: message,
  });
  console.error(
    `Video ${job.media_id} failed on attempt ${job.attempt_count}; the original remains playable and retry is scheduled for ${nextAttemptAt}.`,
    error
  );
}

async function runWorker() {
  while (!stopping) {
    try {
      const job = await claimJob();
      if (!job) {
        await delay(pollIntervalMs);
        continue;
      }
      try {
        await processJob(job);
      } catch (error) {
        await retryJob(job, error);
      }
    } catch (error) {
      console.error("Video worker poll failed; it will retry.", error);
      await delay(pollIntervalMs);
    }
  }
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  response.writeHead(404);
  response.end();
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, "0.0.0.0", () => {
  console.info(`Video worker health endpoint listening on ${port}.`);
  void runWorker();
});

process.on("SIGTERM", () => {
  stopping = true;
  server.close();
});
