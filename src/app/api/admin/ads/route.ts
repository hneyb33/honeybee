import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Admin creation of a standalone ad. Providers create ads through the signed-in
 * `/post-ad` wizard (RLS-limited to draft/pending). An admin has no INSERT policy
 * on `ads`, so manual creation goes through this service-role route, which also
 * seeds any supplied media URLs into `ad_media` and rebuilds the cover image.
 */

const adSchema = z.object({
  ad_type: z.enum(["fast", "independent", "agency"]),
  title: z.string().trim().min(1).max(120),
  category: z.enum(["announcement", "event", "business", "service", "companion"]).nullable(),
  summary_line: z.string().trim().max(180).nullable(),
  description: z.string().trim().min(10).max(10000),
  city: z.string().trim().max(80).nullable(),
  neighborhood: z.string().trim().max(100).nullable(),
  country: z.string().trim().max(80).default("Uganda"),
  contact_whatsapp_code: z.string().trim().max(8).default("+256"),
  contact_whatsapp_number: z.string().trim().max(32).nullable(),
  contact_telegram: z.string().trim().max(120).nullable(),
  links: z
    .array(z.object({ label: z.string().trim().max(80), url: z.string().trim().url().max(400) }))
    .max(20)
    .default([]),
  starts_at: z.string().datetime().nullable(),
  ends_at: z.string().datetime().nullable(),
  amount: z.number().int().min(0).max(999999999).default(0),
  currency: z.string().trim().max(8).default("UGX"),
  status: z.enum(["draft", "pending", "published", "rejected", "expired"]).default("pending"),
  is_featured: z.boolean().default(false),
  featured_tier: z.enum(["premium", "vip"]).nullable().default(null),
  photo_urls: z.array(z.string().url()).max(50).default([]),
  video_urls: z.array(z.string().url()).max(10).default([]),
});

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Admin ad creation is not configured. Set SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in as an admin to create ads." }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "Your admin session is invalid or expired." }, { status: 401 });

  const { data: actor, error: actorError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (actorError) return NextResponse.json({ error: actorError.message }, { status: 500 });
  if (!actor || !["super_admin", "moderator"].includes(actor.role)) {
    return NextResponse.json({ error: "Admin access is required to create ads." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = adSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid ad details." }, { status: 400 });
  }
  const ad = parsed.data;
  if (ad.is_featured && !ad.featured_tier) {
    return NextResponse.json({ error: "Featured ads require a tier." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slugBase = ad.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const { data: inserted, error: insertError } = await adminClient
    .from("ads")
    .insert({
      user_id: null,
      ad_type: ad.ad_type,
      title: ad.title,
      slug: `${slugBase || "honeybee-ad"}-${crypto.randomUUID().slice(0, 8)}`,
      category: ad.category,
      summary_line: ad.summary_line,
      description: ad.description,
      city: ad.city,
      neighborhood: ad.neighborhood,
      country: ad.country,
      contact_whatsapp_code: ad.contact_whatsapp_code,
      contact_whatsapp_number: ad.contact_whatsapp_number,
      contact_telegram: ad.contact_telegram,
      links: ad.links,
      starts_at: ad.starts_at ?? new Date().toISOString(),
      ends_at: ad.ends_at,
      amount: ad.amount,
      currency: ad.currency,
      status: ad.status,
      is_featured: ad.is_featured,
      featured_tier: ad.is_featured ? ad.featured_tier : null,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "The ad could not be created." }, { status: 400 });
  }

  const mediaRows = [
    ...ad.photo_urls.map((url, index) => ({ ad_id: inserted.id, url, kind: "photo", sort_order: index, storage_provider: "supabase", processing_status: "ready" })),
    ...ad.video_urls.map((url, index) => ({ ad_id: inserted.id, url, kind: "video", sort_order: ad.photo_urls.length + index, storage_provider: "supabase", processing_status: "ready" })),
  ];
  if (mediaRows.length > 0) {
    const { error: mediaError } = await adminClient.from("ad_media").insert(mediaRows);
    if (mediaError) {
      await adminClient.from("ads").delete().eq("id", inserted.id);
      return NextResponse.json({ error: `${mediaError.message} The ad was rolled back.` }, { status: 400 });
    }
  }
  if (ad.photo_urls.length > 0) {
    await adminClient.from("ads").update({ cover_image: ad.photo_urls[0] }).eq("id", inserted.id);
  }

  return NextResponse.json({ adId: inserted.id }, { status: 201 });
}
