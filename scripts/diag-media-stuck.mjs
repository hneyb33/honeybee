// Diagnostic: find where media gets stuck between upload and display.
// Usage: node scripts/diag-media-stuck.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_BASE_URL;
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const now = Date.now();
const ageMin = (iso) => Math.round((now - Date.parse(iso)) / 60000);

// 1. profile_media: cloudinary rows by status, with age
const pm = await admin
  .from("profile_media")
  .select("id,kind,storage_provider,processing_status,created_at,listing_id,url,card_url,detail_url,playback_url,cloudinary_public_id")
  .eq("storage_provider", "cloudinary")
  .order("created_at", { ascending: false })
  .limit(100);
console.log("== profile_media cloudinary rows ==", pm.error?.message ?? "ok");
const notReady = (pm.data ?? []).filter((r) => r.processing_status !== "ready");
console.log(`   cloudinary total=${(pm.data ?? []).length} notReady=${notReady.length}`);
for (const r of notReady.slice(0, 15)) {
  console.log(`  ${r.kind}/${r.processing_status} age=${ageMin(r.created_at)}m listing=${r.listing_id} pub=${r.cloudinary_public_id?.slice(-40)}`);
}
// full provider/status distribution
const allPm = await admin.from("profile_media").select("kind,storage_provider,processing_status,created_at").limit(1000);
const pmDist = {};
for (const r of allPm.data ?? []) {
  const k = `${r.kind}/${r.storage_provider}/${r.processing_status}`;
  pmDist[k] = (pmDist[k] ?? 0) + 1;
}
console.log("   all profile_media dist:", JSON.stringify(pmDist));
const cloudPhotoNewest = (allPm.data ?? []).filter((r) => r.storage_provider === "cloudinary" && r.kind === "photo");
console.log(`   cloudinary photos=${cloudPhotoNewest.length}; pending/processing photos=${cloudPhotoNewest.filter((r) => r.processing_status !== "ready").length}`);
const cloudVideoRows = (allPm.data ?? []).filter((r) => r.storage_provider === "cloudinary" && r.kind === "video");
console.log(`   cloudinary videos=${cloudVideoRows.length} statuses=${JSON.stringify(cloudVideoRows.reduce((a, r) => ({ ...a, [r.processing_status]: (a[r.processing_status] ?? 0) + 1 }), {}))}`);
for (const r of cloudVideoRows.filter((x) => x.processing_status !== "ready").slice(0, 10)) {
  console.log(`  video/${r.processing_status} age=${ageMin(r.created_at)}m`);
}

// 2. media_upload_intents: open intents (bytes uploaded but never finalized?)
const probe = await admin.from("media_upload_intents").select("*").limit(1);
console.log("\n== media_upload_intents columns ==", Object.keys(probe.data?.[0] ?? {}).join(",") || "(empty table)");
const intents = await admin
  .from("media_upload_intents")
  .select("*")
  .is("completed_at", null)
  .limit(30);
console.log("== open upload intents ==", intents.error?.message ?? `count=${(intents.data ?? []).length}`);
for (const r of (intents.data ?? []).slice(0, 15)) {
  console.log(`  ${String(r.cloudinary_public_id ?? "no-pubid").slice(-46)} ${JSON.stringify(r).slice(0, 140)}`);
}

// 3. ad_media distribution (table may not exist yet if migration unapplied)
const am = await admin.from("ad_media").select("id,kind,processing_status,storage_provider,created_at").limit(200);
console.log("\n== ad_media ==", am.error?.message ?? "ok");
if (am.data) {
  const dist = {};
  for (const r of am.data) {
    const k = `${r.kind}/${r.storage_provider}/${r.processing_status}`;
    dist[k] = (dist[k] ?? 0) + 1;
  }
  console.log("  dist:", JSON.stringify(dist), "ages:", am.data[0] ? `${ageMin(am.data[0].created_at)}m newest` : "-");
}

// 4. listings columns sanity: recent cloudinary photos present in profile_media
// but missing from listings.images?
const suspect = (pm.data ?? []).filter((r) => r.kind === "photo" && r.processing_status === "ready");
const lids = [...new Set(suspect.map((r) => r.listing_id))].slice(0, 10);
if (lids.length) {
  const ls = await admin.from("listings").select("id,verification_status,images,cover_image").in("id", lids);
  console.log("\n== listings images-column sync ==");
  for (const l of ls.data ?? []) {
    const expected = suspect.filter((r) => r.listing_id === l.id).length;
    const inline = Array.isArray(l.images) ? l.images.filter(Boolean).length : 0;
    console.log(`  ${l.id.slice(0, 8)} status=${l.verification_status} ready_photos=${expected} inline_images=${inline} cover=${l.cover_image ? String(l.cover_image).slice(0, 60) : "NULL"}`);
  }
}

// 5. profile_media ready rows visible to anon (did the RLS fix get applied?)
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const anonMedia = await anon.from("profile_media").select("id", { count: "exact", head: true });
console.log("\n== anon profile_media count ==", anonMedia.error?.message ?? anonMedia.count);

// 6. newest 10 profile_media rows of any provider (did recent submissions land?)
const newest = await admin
  .from("profile_media")
  .select("id,kind,storage_provider,processing_status,created_at,listing_id,url")
  .order("created_at", { ascending: false })
  .limit(10);
console.log("\n== newest profile_media rows ==", newest.error?.message ?? "ok");
for (const r of newest.data ?? []) {
  console.log(`  ${ageMin(r.created_at)}m ago ${r.kind}/${r.storage_provider}/${r.processing_status} ${String(r.url).slice(0, 70)}`);
}
