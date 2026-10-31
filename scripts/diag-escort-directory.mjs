// Diagnostic: replicate the escort-images / escort-videos directory queries
// against the live Supabase project with the anon key (public RLS path).
// Usage: node scripts/diag-escort-directory.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()])
);

const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_BASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local");
  process.exit(1);
}
const client = createClient(url, anonKey, { auth: { persistSession: false } });

const report = (label, { count, error, data }) => {
  console.log(`\n== ${label} ==`);
  if (error) console.log("ERROR:", error.code ?? "", error.message?.slice(0, 300));
  else console.log("rows:", data?.length ?? count ?? 0);
  return data ?? [];
};

// 1) verified listings (as the directory loads them)
const listingsRes = await client
  .from("listings")
  .select("id,title,slug,kind,category,advertiser_type")
  .eq("verification_status", "verified");
const listings = report("1. listings verified (directory select)", listingsRes);
const listingIds = listings.map((l) => l.id);

// 2) fallback: count via head request
const headRes = await client
  .from("listings")
  .select("id", { count: "exact", head: true })
  .eq("verification_status", "verified");
console.log("\n2. listings verified total (count):", headRes.count, headRes.error?.message ?? "");

if (listingIds.length > 0) {
  for (const kind of ["photo", "video"]) {
    // A) exactly as PublicMediaDirectory does it
    const a = await client
      .from("profile_media")
      .select("id,url,thumbnail_url,card_url,detail_url,playback_url,storage_provider,processing_status,listing_id")
      .eq("kind", kind)
      .in("listing_id", listingIds)
      .or("storage_provider.eq.supabase,processing_status.eq.ready")
      .order("created_at", { ascending: false })
      .limit(60);
    report(`3A. profile_media ${kind} (directory query)`, a);

    // B) without the .or() filter to expose what it excludes
    const b = await client
      .from("profile_media")
      .select("id,storage_provider,processing_status,url")
      .eq("kind", kind)
      .in("listing_id", listingIds);
    const rows = report(`3B. profile_media ${kind} (no or filter)`, b);
    const byState = {};
    for (const r of rows) {
      const k = `${r.storage_provider}/${r.processing_status}`;
      byState[k] = (byState[k] ?? 0) + 1;
    }
    console.log("   storage/status distribution:", JSON.stringify(byState));
    if (rows[0]) console.log("   sample url:", String(rows[0].url).slice(0, 120));
  }
} else {
  console.log("\n(no verified listings visible to anon -> directory cannot show media)");
}

// 4) sanity: are there ANY profile_media rows visible to anon at all?
for (const kind of ["photo", "video"]) {
  const all = await client
    .from("profile_media")
    .select("id,storage_provider,processing_status,listing_id")
    .eq("kind", kind)
    .limit(200);
  report(`4. all visible profile_media ${kind} (no listing join)`, all);
}

// 5) service-role ground truth (bypasses RLS)
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const total = await admin.from("profile_media").select("id", { count: "exact", head: true });
  console.log("\n== 5. SERVICE-ROLE ground truth ==");
  console.log("total profile_media rows:", total.count, total.error?.message ?? "");

  const rowsRes = await admin
    .from("profile_media")
    .select("id,kind,storage_provider,processing_status,listing_id,url,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = rowsRes.data ?? [];
  const dist = {};
  for (const r of rows) {
    const k = `${r.kind}/${r.storage_provider}/${r.processing_status}`;
    dist[k] = (dist[k] ?? 0) + 1;
  }
  console.log("distribution (kind/provider/status):", JSON.stringify(dist, null, 0));

  // which listings do these rows belong to, and are those verified?
  const mediaListingIds = [...new Set(rows.map((r) => r.listing_id))];
  if (mediaListingIds.length) {
    const owners = await admin
      .from("listings")
      .select("id,verification_status,kind")
      .in("id", mediaListingIds);
    const statusDist = {};
    for (const l of owners.data ?? []) {
      statusDist[l.verification_status] = (statusDist[l.verification_status] ?? 0) + 1;
    }
    console.log("owner listing verification_status dist:", JSON.stringify(statusDist, null, 0));
  }
  if (rows[0]) console.log("newest row sample:", JSON.stringify({ ...rows[0], url: String(rows[0].url).slice(0, 90) }));

  // url shapes per provider/kind (relative storage path vs full url)
  const shapes = {};
  for (const r of rows) {
    const k = `${r.kind}/${r.storage_provider}`;
    const shape = /^https?:\/\//.test(String(r.url ?? "")) ? "absolute" : "relative";
    shapes[k] = shapes[k] ?? { absolute: 0, relative: 0, examples: [] };
    shapes[k][shape] += 1;
    if (shapes[k].examples.length < 2) shapes[k].examples.push(String(r.url).slice(0, 100));
  }
  console.log("url shapes:");
  for (const [k, v] of Object.entries(shapes)) console.log(`  ${k}: abs=${v.absolute} rel=${v.relative}`);
  for (const [k, v] of Object.entries(shapes)) for (const ex of v.examples) console.log(`    ${k} -> ${ex}`);
} else {
  console.log("\n(no SUPABASE_SERVICE_ROLE_KEY in .env.local; skipping ground-truth)");
}
