// Honeybee Cloudflare Worker entrypoint (Hyperdrive + Supabase).
//
// Split by traffic class, per the migration guide:
//   HYPERDRIVE        — cache ENABLED  — search / filter / directory reads
//   HYPERDRIVE_FRESH  — cache DISABLED — writes + read-after-write
//   SUPABASE (HTTP)   — Auth only (supabase-js). New media never goes through
//                       Supabase Storage: this app stores originals in R2
//                       (HB_ORIGINALS) and ledger rows in media_upload_intents,
//                       exactly like src/app/api/media/* does today.
//
// Bindings come from wrangler.jsonc (add the two "hyperdrive" entries and keep
// SUPABASE_URL / SUPABASE_ANON_KEY in "vars"). After that, `npx wrangler types`
// generates global Hyperdrive/ExportedHandler types; the local shims below let
// this file compile before then and are shadowed by generated types at deploy.
import postgres, { type Sql, type TransactionSql } from "postgres";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// --- minimal binding shims (replace with `npx wrangler types` output) --------
interface Hyperdrive {
  connectionString: string;
  database: string;
  host: string;
  port: number;
}
interface ExecutionContext {
  waitUntil(promise: unknown): void;
  passThroughOnException(): void;
}
interface ExportedHandler<T> {
  fetch(request: Request, env: T, ctx: ExecutionContext): Promise<Response>;
}
interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

export interface Env {
  HYPERDRIVE: Hyperdrive; // cached — for search/filter reads
  HYPERDRIVE_FRESH: Hyperdrive; // cache-disabled — for writes + fresh reads
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  // Next.js/OpenNext deployment also passes these through; accepted as fallback
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  // Private originals bucket (never domain-attached) — see wrangler.jsonc.
  HB_ORIGINALS: R2Bucket;
  // "production" | "development" — first segment of the immutable R2 key.
  R2_ENV?: string;
}

// --- shared SQL fragments (mirror src/lib/media-urls.ts + map-listing.ts) ---

// A listing card is featured while is_featured AND the paid window is open.
// Static SQL text — used only via sql.unsafe(), never with user input.
const FEATURED_ACTIVE =
  `(is_featured AND (featured_until IS NULL OR featured_until > timezone('utc'::text, now())))`;

// Mirrors isPublicMediaReady(): r2/stream rows must be processed+unmoderated;
// legacy supabase/cloudinary rows render as-is; failed rows never render.
const MEDIA_READY =
  `processing_status <> 'failed'
   AND (storage_provider NOT IN ('r2','stream')
        OR (processing_status = 'ready' AND moderation_status <> 'rejected'))`;

const LISTING_CARD_SELECT = `
  l.id, l.user_id, l.title, l.slug, l.kind, l.escort_tier, l.service_type,
  l.category, l.age, l.gender, l.city, l.neighborhood, l.country,
  l.hourly_rate, l.monthly_price, l.currency, l.summary_line, l.description,
  l.rating, l.review_count, l.cover_image, l.is_featured, l.featured_until,
  l.advertiser_type, l.last_seen_at, l.created_at, l.updated_at,
  (
    SELECT json_agg(m ORDER BY m.sort_order)
    FROM (
      SELECT url, thumbnail_url, card_url, detail_url, storage_provider, blurhash
      FROM public.profile_media pm
      WHERE pm.listing_id = l.id
        AND pm.kind = 'photo'
        AND ${MEDIA_READY}
      LIMIT 8
    ) m
  ) AS media
`;

type AuthResult =
  | { client: SupabaseClient; userId: string; token: string }
  | { error: string; status: number };

// Auth stays on Supabase HTTP (supabase-js), same as authenticated-request.ts.
// Hyperdrive is for SQL only — it never sees the anon key or user JWT.
async function authenticate(
  request: Request,
  env: Env
): Promise<AuthResult> {
  const baseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!baseUrl || !anonKey) {
    return { error: "Authentication is not configured.", status: 503 };
  }
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { error: "Sign in to continue.", status: 401 };
  }
  const client = createClient(baseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Your session is invalid or expired.", status: 401 };
  }
  return { client, userId: data.user.id, token };
}

// Run fn inside a transaction where Postgres acts as the `authenticated` role
// with the user's JWT claims — this keeps Supabase RLS policies (listings,
// profile_media, profile_offerings) enforced on raw SQL exactly as they are for
// supabase-js REST writes. Tables that intentionally have NO policies (
// media_upload_intents) must NOT use this — they run on the connection's
// default privileges, mirroring how the API routes use the service role.
async function withRLS<T>(
  sqlFresh: Sql,
  userId: string,
  fn: (tx: TransactionSql) => Promise<T>
): Promise<T> {
  return sqlFresh.begin(async (tx) => {
    await tx`SELECT set_config('role', 'authenticated', true)`;
    await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
    })}, true)`;
    return fn(tx);
  }) as unknown as Promise<T>;
}

function num(
  params: URLSearchParams,
  name: string,
  min: number,
  max: number,
  fallback: number
): number {
  const v = Number.parseInt(params.get(name) ?? "", 10);
  if (Number.isNaN(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function one(params: URLSearchParams, name: string): string | null {
  const v = params.get(name);
  return v && v.length ? v : null;
}

// Whitelisted ORDER BY variants — never interpolate raw client sort values.
const SORTS: Record<string, string> = {
  newest: `ORDER BY ${FEATURED_ACTIVE} DESC, l.created_at DESC`,
  price_asc: "ORDER BY l.hourly_rate ASC NULLS LAST, l.created_at DESC",
  price_desc: "ORDER BY l.hourly_rate DESC NULLS LAST, l.created_at DESC",
  rating: "ORDER BY l.rating DESC, l.review_count DESC, l.created_at DESC",
  seen: "ORDER BY l.last_seen_at DESC NULLS LAST, l.created_at DESC",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // --- Hyperdrive SQL clients (create per request — pooling is managed) ---
    // Cached client: search, filter, catalog reads.
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false,
      prepare: true,
    });
    // Fresh client: writes and read-after-write.
    const sqlFresh = postgres(env.HYPERDRIVE_FRESH.connectionString, {
      max: 5,
      fetch_types: false,
      prepare: true,
    });

    // --- Supabase client for Auth (HTTP, not Hyperdrive) ---
    const supabase = createClient(
      env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    // Close pooled clients after the response is on its way.
    ctx.waitUntil(
      Promise.allSettled([sql.end({ timeout: 15 }), sqlFresh.end({ timeout: 15 })])
    );

    try {
      // =========================================================================
      // READS — HYPERDRIVE (cached)
      // =========================================================================

      // Health check — proves the Hyperdrive path reaches Postgres end to end.
      // Reuses the request-scoped `sql` client (cached binding) instead of
      // opening a third pool here.
      if (url.pathname === "/api/health") {
        try {
          const [{ now }] = await sql`SELECT NOW() as now`;
          const [{ version }] = await sql`SELECT version() as version`;
          return Response.json({
            status: "connected",
            database_time: now,
            pg_version: version,
            via: "hyperdrive",
          });
        } catch (e) {
          const err = e as { message?: string };
          return Response.json(
            { status: "error", message: err.message },
            { status: 500 }
          );
        }
      }

      // Timing probe — runs the same read twice through the cached binding and
      // reports per-pass duration. With Hyperdrive caching active the second
      // pass should be dramatically faster while the cache window is open;
      // pass ?binding=fresh to run both passes on HYPERDRIVE_FRESH (no cache)
      // as the baseline comparison.
      if (url.pathname === "/api/health/timing") {
        const db =
          url.searchParams.get("binding") === "fresh" ? sqlFresh : sql;
        const read = db`
          SELECT id, title, slug, created_at
          FROM public.listings
          WHERE verification_status = 'verified'
          ORDER BY created_at DESC
          LIMIT 50
        `;

        const t1 = performance.now();
        const pass1 = await read;
        const ms1 = performance.now() - t1;

        const t2 = performance.now();
        const pass2 = await read;
        const ms2 = performance.now() - t2;

        return Response.json({
          binding: db === sqlFresh ? "HYPERDRIVE_FRESH" : "HYPERDRIVE",
          rows_returned: pass2.length,
          same_result: pass1.length === pass2.length,
          pass1_ms: Math.round(ms1 * 100) / 100,
          pass2_ms: Math.round(ms2 * 100) / 100,
          speedup_x: ms2 > 0 ? Math.round((ms1 / ms2) * 100) / 100 : null,
        });
      }

      // Text search over the verified directory (title / blurb / description /
      // services), same corpus the public pages show, featured-first ordering.
      if (url.pathname === "/api/search") {
        const q = (one(url.searchParams, "q") ?? "").slice(0, 120);
        const page = num(url.searchParams, "page", 1, 200, 1);
        const like = `%${q}%`;
        const rows = await sql`
          SELECT ${sql.unsafe(LISTING_CARD_SELECT)}
          FROM public.listings l
          WHERE l.verification_status = 'verified'
            AND (
              l.title ILIKE ${like}
              OR l.summary_line ILIKE ${like}
              OR l.description ILIKE ${like}
              OR l.services_offered::text ILIKE ${like}
            )
          ${sql.unsafe(`ORDER BY ${FEATURED_ACTIVE} DESC, l.created_at DESC`)}
          LIMIT 50 OFFSET ${(page - 1) * 50}
        `;
        return Response.json({ results: rows });
      }

      // Directory filter — mirrors PublicListingDirectory + ListingGrid props:
      // kind, category, city/neighborhood, tier, price band (escort hourly_rate
      // vs service rates JSONB), age band, gender, advertiser presence.
      if (url.pathname === "/api/listings") {
        const p = url.searchParams;
        const where = [sql`l.verification_status = 'verified'`];

        const kind = one(p, "kind");
        if (kind === "escort" || kind === "service")
          where.push(sql`l.kind = ${kind}`);

        const category = one(p, "category");
        if (category) where.push(sql`l.category = ${category}`);

        const city = one(p, "city");
        if (city) where.push(sql`l.city = ${city}`);

        const neighborhood = one(p, "neighborhood");
        if (neighborhood) where.push(sql`l.neighborhood = ${neighborhood}`);

        const country = one(p, "country");
        if (country) where.push(sql`l.country = ${country}`);

        const tier = one(p, "escort_tier");
        if (tier === "standard" || tier === "premium" || tier === "vip")
          where.push(sql`l.escort_tier = ${tier}`);

        const gender = one(p, "gender");
        if (gender) where.push(sql`l.gender = ${gender}`);

        const advertiser = one(p, "advertiser_type");
        if (advertiser === "fast" || advertiser === "independent" || advertiser === "agency")
          where.push(sql`l.advertiser_type = ${advertiser}`);

        if (p.get("featured") === "true")
          where.push(sql`(${sql.unsafe(FEATURED_ACTIVE)})`);

        const minAge = num(p, "min_age", 18, 99, 0) || null;
        if (minAge) where.push(sql`l.age >= ${minAge}`);
        const maxAge = num(p, "max_age", 18, 99, 0) || null;
        if (maxAge) where.push(sql`l.age <= ${maxAge}`);

        const minRate = num(p, "min_rate", 0, 1_000_000_000, 0) || null;
        if (minRate !== null) where.push(sql`l.hourly_rate >= ${minRate}`);
        const maxRate = num(p, "max_rate", 0, 1_000_000_000, 0) || null;
        if (maxRate !== null) where.push(sql`l.hourly_rate <= ${maxRate}`);

        const sort = SORTS[p.get("sort") ?? "newest"] ?? SORTS.newest;
        const pageSize = num(p, "page_size", 1, 100, 48);
        const page = num(p, "page", 1, 500, 1);
        const offset = (page - 1) * pageSize;
        const whereClause = sql` AND `.join(where);

        const [rows, countRow] = await Promise.all([
          sql`
            SELECT ${sql.unsafe(LISTING_CARD_SELECT)}
            FROM public.listings l
            WHERE ${whereClause}
            ${sql.unsafe(sort)}
            LIMIT ${pageSize} OFFSET ${offset}
          `,
          sql`
            SELECT count(*)::int AS total
            FROM public.listings l
            WHERE ${whereClause}
          `,
        ]);
        return Response.json({
          results: rows,
          page,
          page_size: pageSize,
          total: countRow[0]?.total ?? 0,
        });
      }

      // Single profile detail: offerings + media + references-safe columns.
      const listingMatch = url.pathname.match(/^\/api\/listings\/([a-z0-9-]+)$/i);
      if (listingMatch && request.method === "GET") {
        const slug = listingMatch[1];
        const [row] = await sql`
          SELECT ${sql.unsafe(LISTING_CARD_SELECT)},
                 l.about_me, l.services_offered, l.languages, l.rates,
                 l.availability, l.experience_band, l.has_certificate,
                 l.travel_km, l.whatsapp_number, l.whatsapp_code,
                 l.telegram, l.telegram_code, l.profile_details,
                 (
                   SELECT json_agg(o ORDER BY o.sort_order)
                   FROM public.profile_offerings o
                   WHERE o.listing_id = l.id
                 ) AS offerings
          FROM public.listings l
          WHERE l.slug = ${slug}
            AND l.verification_status = 'verified'
          LIMIT 1
        `;
        if (!row) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ listing: row });
      }

      // Published, currently-active ads (featured-first) — same predicate as
      // loadActiveAds() in src/lib/supabase/ads.ts, read through the cache.
      if (url.pathname === "/api/ads") {
        const p = url.searchParams;
        const where = [
          sql`a.status = 'published'`,
          sql`(a.ends_at IS NULL OR a.ends_at > timezone('utc'::text, now()))`,
        ];
        const adType = one(p, "ad_type");
        if (adType === "fast" || adType === "independent" || adType === "agency")
          where.push(sql`a.ad_type = ${adType}`);
        if (p.get("featured_only") === "true") where.push(sql`a.is_featured = true`);
        const city = one(p, "city");
        if (city) where.push(sql`a.city = ${city}`);

        const rows = await sql`
          SELECT a.id, a.ad_type, a.title, a.slug, a.category, a.summary_line,
                 a.description, a.city, a.neighborhood, a.country, a.links,
                 a.cover_image, a.is_featured, a.featured_tier, a.starts_at,
                 a.ends_at,
                 (
                   SELECT json_agg(m ORDER BY m.sort_order)
                   FROM (
                     SELECT url, thumbnail_url, card_url, detail_url, kind,
                            storage_provider, blurhash
                     FROM public.ad_media am
                     WHERE am.ad_id = a.id
                       AND am.kind = 'photo'
                       AND ${sql.unsafe(MEDIA_READY)}
                     LIMIT 8
                   ) m
                 ) AS media
          FROM public.ads a
          WHERE ${sql` AND `.join(where)}
          ORDER BY a.is_featured DESC, a.ends_at ASC NULLS LAST
          LIMIT 100
        `;
        return Response.json({ results: rows });
      }

      // Standalone ad detail by slug.
      const adMatch = url.pathname.match(/^\/api\/ads\/([a-z0-9-]+)$/i);
      if (adMatch && request.method === "GET") {
        const [row] = await sql`
          SELECT a.*
          FROM public.ads a
          WHERE a.slug = ${adMatch[1]} AND a.status = 'published'
          LIMIT 1
        `;
        if (!row) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ ad: row });
      }

      // =========================================================================
      // WRITES + READ-AFTER-WRITE — HYPERDRIVE_FRESH
      // =========================================================================

      // Create a listing (provider onboarding first step). RLS is re-applied
      // via withRLS so ownership + policy checks match the supabase-js path in
      // use-onboarding.ts.
      if (url.pathname === "/api/listings" && request.method === "POST") {
        const auth = await authenticate(request, env);
        if ("error" in auth)
          return Response.json({ error: auth.error }, { status: auth.status });

        const body = (await request.json()) as Record<string, unknown>;
        const title = String(body.title ?? "").slice(0, 120);
        const slug = String(body.slug ?? title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80);
        const description = String(body.description ?? "").slice(0, 20_000);
        if (!title || !slug || !description)
          return Response.json(
            { error: "title, slug and description are required." },
            { status: 400 }
          );
        const kindVal = body.kind === "service" ? "service" : "escort";
        const tierRaw = String(body.escort_tier ?? "");
        const tierVal =
          tierRaw === "standard" || tierRaw === "vip" ? tierRaw : "premium";

        const row = await withRLS(sqlFresh, auth.userId, async (tx) => {
          const conflict = await tx`
            SELECT 1 FROM public.listings
            WHERE slug = ${slug} OR user_id = ${auth.userId}
            LIMIT 1
          `;
          if (conflict.length)
            throw new Error("Slug already taken or listing already exists.");

          const [created] = await tx`
            INSERT INTO public.listings (
              user_id, title, slug, kind, escort_tier, service_type, category,
              age, gender, ethnicity, nationality, country, city, neighborhood,
              hourly_rate, monthly_price, currency, summary_line, description,
              about_me, services_offered, languages, rates, availability,
              verification_status, whatsapp_number, whatsapp_code, telegram,
              telegram_code, profile_details
            ) VALUES (
              ${auth.userId},
              ${title},
              ${slug},
              ${kindVal},
              ${tierVal},
              ${String(body.service_type ?? "") || null},
              ${String(body.category ?? "female").slice(0, 40)},
              ${typeof body.age === "number" ? body.age : null},
              ${String(body.gender ?? "") || null},
              ${String(body.ethnicity ?? "") || null},
              ${String(body.nationality ?? "Ugandan").slice(0, 60)},
              ${String(body.country ?? "Uganda").slice(0, 60)},
              ${String(body.city ?? "Kampala").slice(0, 80)},
              ${String(body.neighborhood ?? "Central").slice(0, 80)},
              ${Number(body.hourly_rate ?? 50000)},
              ${body.monthly_price == null ? null : Number(body.monthly_price)},
              ${String(body.currency ?? "UGX").slice(0, 8)},
              ${String(body.summary_line ?? "").slice(0, 300) || null},
              ${description},
              ${String(body.about_me ?? "") || null},
              ${tx.json(body.services_offered ?? [])},
              ${tx.json(body.languages ?? ["English", "Luganda"])},
              ${tx.json(body.rates ?? {})},
              ${tx.json(body.availability ?? [])},
              'pending',
              ${String(body.whatsapp_number ?? "") || null},
              ${String(body.whatsapp_code ?? "+256").slice(0, 8)},
              ${String(body.telegram ?? "") || null},
              ${String(body.telegram_code ?? "+256").slice(0, 8)},
              ${tx.json(body.profile_details ?? {})}
            )
            RETURNING *
          `;
          return created;
        });
        return Response.json({ listing: row });
      }

      // Update own listing (owner-only; RLS via withRLS does the ownership
      // check exactly like the REST `.eq('user_id', uid)` updates).
      const listingIdMatch = url.pathname.match(
        /^\/api\/listings\/([0-9a-f-]{36})$/i
      );
      if (listingIdMatch && request.method === "PATCH") {
        const auth = await authenticate(request, env);
        if ("error" in auth)
          return Response.json({ error: auth.error }, { status: auth.status });

        const id = listingIdMatch[1];
        const body = (await request.json()) as Record<string, unknown>;

        const row = await withRLS(sqlFresh, auth.userId, async (tx) => {
          // Column identifiers are a hardcoded whitelist; values are always
          // parameters — never client-supplied identifiers.
          const sets = [tx`updated_at = timezone('utc'::text, now())`];
          if (typeof body.title === "string")
            sets.push(tx`title = ${body.title}`);
          if (typeof body.summary_line === "string")
            sets.push(tx`summary_line = ${body.summary_line}`);
          if (typeof body.description === "string")
            sets.push(tx`description = ${body.description}`);
          if (typeof body.about_me === "string")
            sets.push(tx`about_me = ${body.about_me}`);
          if (typeof body.city === "string")
            sets.push(tx`city = ${body.city}`);
          if (typeof body.neighborhood === "string")
            sets.push(tx`neighborhood = ${body.neighborhood}`);
          if (typeof body.hourly_rate === "number")
            sets.push(tx`hourly_rate = ${body.hourly_rate}`);
          if (typeof body.monthly_price === "number")
            sets.push(tx`monthly_price = ${body.monthly_price}`);
          if (Array.isArray(body.availability))
            sets.push(tx`availability = ${tx.json(body.availability)}`);
          if (Array.isArray(body.services_offered))
            sets.push(tx`services_offered = ${tx.json(body.services_offered)}`);
          if (body.profile_details && typeof body.profile_details === "object")
            sets.push(tx`profile_details = ${tx.json(body.profile_details)}`);

          const updated = await tx`
            UPDATE public.listings
               SET ${tx`, `.join(sets)}
             WHERE id = ${id}::uuid
               AND user_id = ${auth.userId}
            RETURNING id, slug, updated_at
          `;
          return updated[0] ?? null;
        });
        if (!row)
          return Response.json(
            { error: "Not found or not yours." },
            { status: 404 }
          );
        return Response.json({ listing: row });
      }

      // Read right after write (my latest listing, bypassing the cache).
      if (url.pathname === "/api/me/listing" && request.method === "GET") {
        const auth = await authenticate(request, env);
        if ("error" in auth)
          return Response.json({ error: auth.error }, { status: auth.status });
        const [row] = await sqlFresh`
          SELECT id, slug, title, verification_status, updated_at
          FROM public.listings
          WHERE user_id = ${auth.userId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        return Response.json({ listing: row ?? null });
      }

      // =========================================================================
      // STORAGE — R2 originals + intent ledger (this app's real pipeline)
      // =========================================================================

      // Authorize + store an original in hb-originals and record the intent so
      // the queue processor can finalize it (media.honeysbees.com variants are
      // produced by workers/media-processor, never written here). Key scheme is
      // immutable: {env}/{userId}/{scope}/{targetId}/{assetId}/original.{ext}.
      if (url.pathname === "/api/media/upload" && request.method === "POST") {
        const auth = await authenticate(request, env);
        if ("error" in auth)
          return Response.json({ error: auth.error }, { status: auth.status });

        const form = await request.formData();
        const file = form.get("file");
        const scope = String(form.get("scope") ?? "listing"); // listing | ad
        const targetId = String(form.get("target_id") ?? "");
        const resourceType =
          String(form.get("resource_type") ?? "image") === "video"
            ? "video"
            : "image";
        if (
          !(file instanceof File) ||
          !file.size ||
          !targetId ||
          (scope !== "listing" && scope !== "ad")
        )
          return Response.json(
            { error: "file, scope (listing|ad) and target_id are required." },
            { status: 400 }
          );

        // Ownership check on the fresh connection (default privileges, like the
        // service-role API routes do today for intents).
        const owned =
          scope === "listing"
            ? await sqlFresh`
                SELECT 1 FROM public.listings
                WHERE id = ${targetId}::uuid AND user_id = ${auth.userId}
                LIMIT 1
              `
            : await sqlFresh`
                SELECT 1 FROM public.ads
                WHERE id = ${targetId}::uuid AND user_id = ${auth.userId}
                LIMIT 1
              `;
        if (!owned.length)
          return Response.json(
            { error: "Target not found or not yours." },
            { status: 404 }
          );

        const ext =
          file.type === "image/jpeg"
            ? "jpg"
            : file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : resourceType === "video"
                  ? "mp4"
                  : "";
        if (!ext)
          return Response.json(
            { error: "Unsupported content type." },
            { status: 415 }
          );

        const assetId = crypto.randomUUID();
        const key = [
          env.R2_ENV ?? "production",
          auth.userId,
          scope,
          targetId,
          assetId,
          `original.${ext}`,
        ].join("/");
        await env.HB_ORIGINALS.put(key, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        // Intents ledger has NO RLS policies by design (migration
        // 20261030000000) and listing_id is NOT NULL, so it is written on the
        // connection's default privileges (like the service-role API routes)
        // and only for listing scope; ad originals are picked up by the R2
        // event notification -> hb-media-process queue regardless.
        let intent: { id: string; requested_at: string } | null = null;
        if (scope === "listing") {
          const [row] = await sqlFresh`
            INSERT INTO public.media_upload_intents
              (listing_id, user_id, media_key, resource_type)
            VALUES
              (${targetId}::uuid, ${auth.userId}::uuid, ${key}, ${resourceType})
            RETURNING id, requested_at
          `;
          intent = (row as unknown as { id: string; requested_at: string }) ?? null;
        }
        return Response.json({ asset_id: assetId, key, intent });
      }

      // =========================================================================
      // AUTH — Supabase HTTP (never Hyperdrive)
      // =========================================================================

      if (url.pathname === "/api/auth/signup" && request.method === "POST") {
        const { email, password, name } = (await request.json()) as {
          email?: string;
          password?: string;
          name?: string;
        };
        if (!email || !password)
          return Response.json(
            { error: "email and password are required." },
            { status: 400 }
          );
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: name ? { name } : undefined },
        });
        if (error)
          return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ user: data.user });
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const { email, password } = (await request.json()) as {
          email?: string;
          password?: string;
        };
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email ?? "",
          password: password ?? "",
        });
        if (error)
          return Response.json({ error: error.message }, { status: 401 });
        return Response.json({
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          user: data.user,
        });
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const auth = await authenticate(request, env);
        if ("error" in auth)
          return Response.json({ error: auth.error }, { status: auth.status });
        const { data } = await auth.client.auth.getUser();
        return Response.json({ user: data.user });
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      const err = e as { message?: string };
      console.error("Error:", err.message);
      return new Response(err.message ?? "Internal error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
