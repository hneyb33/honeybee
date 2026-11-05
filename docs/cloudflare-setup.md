# Cloudflare Setup (R2 + Queues + Stream + Workers)

Runbook for moving Honeybee from Vercel + Cloudinary to Cloudflare. Follow the
phases in order; every `wrangler` command is safe to re-run and idempotent
where noted. Secrets go through `wrangler secret put`, never into
`wrangler.jsonc`.

## Phase 0 - Pre-flight (blocking)

1. **Content-category confirmation.** Before creating any R2/Stream resource,
   get Cloudflare's written confirmation that the site's content category is
   acceptable on R2, Images and Stream. Their terms allow removal of content
   they judge harmful - settle this with Cloudflare trust & safety first.
2. Dashboard -> account settings: enable **R2**, subscribe to the **Workers
   Paid plan** (required for Queues, R2 event notifications and the Images
   binding), enable **Stream** (video streaming).
3. Ensure `honeysbees.com` is on a Cloudflare zone with nameservers moved, and
   2FA enabled on the account.
4. Log in locally: `npx wrangler login`.

## Phase 1 - Buckets and custom domain

```bash
npx wrangler r2 bucket create hb-originals    # private forever - never attach a domain
npx wrangler r2 bucket create hb-media        # variants, served via media.honeysbees.com
npx wrangler r2 bucket create-domains hb-media --domain media.honeysbees.com
```

- Key scheme is immutable (never overwrite a key), so `media.honeysbees.com`
  responses can be cached forever:
  - originals: `{env}/{userId}/{scope}/{targetId}/{assetId}/original.{ext}` in `hb-originals`
  - variants:  `{env}/{userId}/{assetId}/{thumb|card|detail}.webp` in `hb-media`

**CORS** (browser PUTs to the S3 endpoint): R2 dashboard -> hb-originals ->
CORS policy, allow the site origin(s) with methods `PUT, POST` and headers
`Content-Type, Content-Length`; expose `ETag`.

**S3 API tokens** (scoped, not the account-global keys):
- Account -> R2 -> Manage R2 API Keys -> create a token limited to
  `Object Read & Write` on `hb-originals` only -> `wrangler secret put R2_ACCESS_KEY_ID`
  and `wrangler secret put R2_SECRET_ACCESS_KEY`.
- The processor Worker uses native bindings, so the media bucket needs no
  app-facing token.

## Phase 2 - Queue + event notifications

```bash
npx wrangler queues create hb-media-process
npx wrangler queues create hb-media-process-dlq
```

R2 dashboard -> hb-originals -> Event notifications -> create:
- name `hb-originals-events`, prefix filter `{env}/` (e.g. `production/`),
  event `Object Created`, destination queue `hb-media-process`.

Consumer (deploy the processor Worker first, see `workers/media-processor/`):

```bash
npx wrangler queues consumer workers add hb-media-process --worker-name honeybee-media-processor --dlq hb-media-process-dlq
```

## Phase 3 - Stream

- Capture a **Direct Upload / encoding webhook secret**:
  Stream dashboard -> Lists -> Authentication -> "Let Cloudflare sign the
  webhook payloads" -> copy the secret -> `wrangler secret put CLOUDFLARE_STREAM_WEBHOOK_SECRET`.
- Create an API token with **Stream:Edit** (and Read) permissions ->
  `wrangler secret put CLOUDFLARE_STREAM_API_TOKEN`.
- Set `requireSignedURLs` ON for the account's default (or per-video via the
  API - the app always sets it per video).
- Allowedorigins: Stream settings -> allow only the production origin(s).

## Phase 4 - Deploy the app

```bash
npm run build:cf        # opennextjs-cloudflare build (runs next build + emits .open-next/worker.js)
npx wrangler deploy     # pushes the Next app + the media-processor worker
```

**Workers Builds (CI) gotcha:** the dashboard build command must be
`npm run build:cf`, not `npm run build`. Plain `next build` produces no
`.open-next/` output and `wrangler deploy` then fails with "Could not find
compiled Open Next config, did you run the build command?". Deploy command
stays `npx wrangler deploy` (it auto-detects the OpenNext project). CI does
not read `.env.local`: keep non-secret values in `wrangler.jsonc` `vars`
(replace the placeholders) and set secrets via the dashboard's build settings
or `wrangler secret put`.

**Stream deferred:** with `CLOUDFLARE_STREAM_API_TOKEN` unset the app
auto-falls back to the legacy Cloudinary flow for every video upload, so
`CLOUDINARY_*` vars must stay deployed until Phase 3 is done and
`--include-videos` migration runs.

Point the zone `A/CNAME` for the app hostname at the Workers deployment
(`.workers.dev` preview first for a smoke test), then run
`npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` to
refresh binding types.

## Phase 5 - Dashboard-only hardening

- **WAF**: enable the managed ruleset on the zone.
- **Rate limiting** rules: `/api/media/*` (signature/stream-upload/finalize),
  `/login`, `/register`, chat endpoints.
- **Turnstile** widgets for login/register/onboarding: add site key to
  `NEXT_PUBLIC_TURNSTILE_SITEKEY`, secret via `wrangler secret put TURNSTILE_SECRET`.
- **Cache rules** for `media.honeysbees.com`: respect origin cache-control
  (variants are written with `immutable`); Brotli/HTTP-3/Early Hints are on by
  default; enable **Tiered Cache** (advanced, regional).
- **Argo**: leave OFF unless tests show slow paths to the origin.
- **CSAM scanning tool**: enable (free, dashboard toggle) given user uploads.
- **Access (Zero Trust)** in front of `/admin` (optional, flag up first).
- **Notifications**: usage spikes + DDoS alerts to the ops email.

## Cost guardrails (verified against the pricing in the migration guide)

- R2 egress is free; writes/cache-misses cost - do not write many tiny objects
  or poll `ListObjects`.
- Core image sizes are **pre-generated** (thumb/card/detail); on-demand
  `/cdn-cgi/image/*` is reserved for ad-hoc sizes and must stay allowlisted -
  never let clients request arbitrary widths.
- Stream: encoding/ingress free; $5 per 1,000 min stored, $1 per 1,000 min
  delivered - model viewer-minutes before launch.
- Do not front Stream through a third-party CDN (against Stream terms).

## Migration from Cloudinary

Run after the app is live on Workers and dual-read (cloudinary + r2/stream
rows) is verified:

```bash
node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs --dry --limit 5   # rehearsal
node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs                    # full run, resumable
node --env-file=.env.local scripts/migrate-cloudinary-to-r2.mjs --include-videos   # optional Stream leg
```

(`--env-file` points at whichever file holds the production values: Supabase,
Cloudinary, `CF_ACCOUNT_ID`, `R2_*` and, for videos, `CLOUDFLARE_STREAM_*`.
Progress is tracked in `.cloudinary-migration-checkpoint.json` - keep it to
resume, delete it to force a full re-walk.)

Then remove `CLOUDINARY_*` vars from the deployment, keep the Cloudinary
account warm for 30 days, and delete it.
