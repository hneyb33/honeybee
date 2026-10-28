# Honeybee 🐝

East Africa's verified platform for private specialists, culinary masters, and companions — built with **Next.js 15 (App Router)**, **React 19**, **shadcn/ui**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**, optimized for deployment on **Vercel**.

---

## 🌟 Key Features & Improvements

- **Airbnb-Inspired UX & Aesthetic**:
  - Interactive search capsule (`Where`, `Category`, `Service`, `Near you` geolocation distance calculation).
  - Horizontal tier bar (All, VIP, Premium, Specialists, Women, Men).
  - Listing cards with multi-photo slider, rating, and favorite heart toggle. Specialist service rates are shown; model pricing is discussed directly in chat.
  - Signature Airbnb 5-photo mosaic layout on profile detail pages with full-screen lightbox.
- **Conversion & Experience Optimization (CRO/CXO)**:
  - Sticky bottom booking and direct chat bar (instant WhatsApp pre-filled message & Telegram link).
  - Interactive booking modal for starting WhatsApp service requests; model pricing is discussed directly in chat.
  - Client review submission dialog.
- **Rectified Business Logic**:
  - Unified currency to Ugandan Shillings (`UGX`).
  - Country-aware registration and discovery for Uganda, Kenya, Tanzania, the Democratic Republic of the Congo, Rwanda, Burundi, and South Sudan, with matching phone calling codes and major cities.
  - Separation between Home Specialists (Chefs, Laundry, Massage) and Companions.
  - Strict verification gating: unverified profiles never appear in discovery.
  - Persistent 18+ age verification gate.
  - Provider onboarding locations are saved to the public places catalogue and appear in discovery autocomplete and location pills.
- **Provider Operations Hub (`/provider`)**:
  - Live availability switcher (🟢 Available / 🟡 Busy / ⚫ Offline).
  - Real-time job request queue with Accept/Decline actions.
  - Weekly schedule and earnings breakdown.
- **Multi-Step Onboarding Wizard (`/provider/onboarding`)**:
  - Resumable five-step flows for models, agencies, and home-service providers.
  - Model accounts choose from the database-backed Hot offers catalogue; selected offers appear on their profile and can be opened as WhatsApp chat requests. Model prices are not displayed.
  - City/neighbourhood selectors, choice controls, availability, specialist service rates, profile details, and required portfolio upload of at least one photo and one video (up to 9 photos and 3 videos).
  - JPEG, PNG, and WebP photos (10 MiB each) and MP4, WebM, and QuickTime videos (100 MiB and up to 2 minutes each) are uploaded directly from the browser to Cloudinary. H.264 MP4 is recommended as an input; WebM and QuickTime support varies by device.
  - Provider-owned drafts stay private until admin verification; verified profiles load from Supabase on their public profile page.
- **Admin Moderation & Audit Queue (`/admin`)**:
  - Supabase Auth sign-in restricted to administrator and moderator roles.
  - Database-backed profile verification presents each profile's details, photos, and videos together for a single verify/reject decision; media is not approved independently.
  - Transaction-safe payment review that activates the related subscription.
  - Dashboard counts for profiles, bookings, and payments.
- **Provider media catalogues (`/escort-images`, `/escort-videos`)**:
  - Verified profiles from every provider category can appear in the photo and video galleries.
  - Verified profile pages show submitted videos in a swipeable video reel directly below the photo gallery. New media uses Cloudinary-generated card/detail images, H.264/AAC MP4 playback variants, and JPEG posters. Legacy Supabase media continues to render as a fallback.
- **Advertiser tools (`/advertise`)**:
  - Fast single-ad, independent, and agency registration paths.
  - Profiles remain private until moderator verification; verified Mobile Money payments activate featured placement.
  - Providers can mark themselves available in the operations hub; online indicators expire after five minutes without a heartbeat.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add the Supabase public settings, server-only keys, and Cloudinary account values used by media uploads:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
Keep `SUPABASE_SERVICE_ROLE_KEY` and `CLOUDINARY_API_SECRET` server-side only. Never prefix them with `NEXT_PUBLIC_` or expose them to the browser. The browser receives a time-limited signed upload authorization from Honeybee; the media bytes go directly to Cloudinary.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
```

---

## 📦 Supabase Database Setup

1. Open your Supabase Dashboard: [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor**.
3. Run every SQL migration in `supabase/migrations/` in filename order. For an existing installation, apply any migrations that have not yet been run, including `20261028000000_cloudinary_media_pipeline.sql`, before deploying code that reads the Cloudinary columns. This migration preserves existing Supabase rows and changes owner inserts to remain limited to Supabase-backed media; Cloudinary records are registered by the authenticated server route using the service-role key.
4. (Optional) Run `supabase/seed.sql` to add sample listings and places.

### Cloudinary media pipeline

New provider uploads follow this path:

1. The browser requests an authenticated, server-signed upload authorization.
2. The browser uploads the original file directly to Cloudinary. Videos larger than 100,000,000 bytes use chunked uploads.
3. Honeybee verifies Cloudinary's asset metadata and registers the media row. Video eager transformations may complete asynchronously; onboarding checks their status before completing.
4. Public cards and galleries use the generated Cloudinary variants. Next.js image optimization is disabled so image transformations do not run through Vercel. Existing Supabase media continues to use its stored URLs.

The server defines the allowed transformations: 640×480 WebP card images, max-1600 WebP detail images, H.264/AAC MP4 playback up to 1280×720, and JPEG video posters. Upload limits are 10 MiB per photo, 100 MiB per video, and two minutes per video. Finalization checks the video duration and file size independently of browser validation.

Before enabling uploads in a deployment:

1. Back up the database and apply `20261028000000_cloudinary_media_pipeline.sql` through the Supabase SQL Editor or the project's migration workflow.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and the public Supabase URL/key in the target environment.
3. Deploy the application, then test a photo and a video upload through onboarding. Check that the media appears in the admin review queue, profile gallery, public listing cards, and photo/video directories.
4. In browser network tools, confirm file requests go to Cloudinary and image requests do not pass through `/_next/image`. Verify that Cloudinary URLs serve the expected card/detail/playback/poster variants.

### Video transcoding worker

The independent FFmpeg worker in `video-worker/` remains responsible for legacy Supabase Storage videos that still have a `source_path`. New Cloudinary uploads do not enter this queue: Cloudinary creates their playback and poster variants. Keep the worker running during the migration and pilot so legacy videos continue to process.

For Google Cloud Run:

1. Apply the Supabase migrations, including `20261021000000_profile_video_processing.sql`.
2. Store the Supabase service-role key in Google Secret Manager as `honeybee-supabase-service-role` and allow the Cloud Run runtime service account to access it. Never expose this key in the browser or commit it.
3. Deploy from the repository root:
   ```sh
   gcloud run deploy honeybee-video-worker \
     --source video-worker \
     --region YOUR_REGION \
     --min 1 \
     --no-cpu-throttling \
     --no-allow-unauthenticated \
     --cpu 2 \
     --memory 2Gi \
     --concurrency 1 \
     --set-env-vars SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
     --set-secrets SUPABASE_SERVICE_ROLE_KEY=honeybee-supabase-service-role:latest
   ```
   Keep at least one instance with CPU always allocated so the queue poller keeps running. This has an ongoing infrastructure cost; monitor Cloud Run and Supabase usage.
4. Check the service logs for `Video worker health endpoint listening` and successful processing messages. The container exposes `GET /healthz` for health checks.

The original is retained in Supabase Storage as a fallback for legacy jobs. Failed jobs record their error and are retried indefinitely with capped backoff; conversion success switches playback to the MP4 and attaches the generated poster. Existing videos in the Honeybee media bucket are queued by the migration. Videos stored outside that bucket remain untouched. Do not retire the worker until Cloudinary uploads, playback, and posters have been verified in production and all legacy Supabase jobs are ready or otherwise resolved. Keep existing Supabase objects and URLs available for fallback rendering.

### Create the first admin login

Admin accounts use Supabase Auth credentials; Honeybee does not ship a shared or hardcoded admin password.

1. In Supabase, open **Authentication → Users** and create/confirm the admin user with the desired email and password.
2. Copy that user's UUID from the Auth user list.
3. In the SQL Editor, promote only that trusted account (replace both placeholders):
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin', account_kind = 'admin'
   WHERE id = 'AUTH_USER_UUID' AND email = 'admin@example.com';
   ```
4. Sign in at `/login` with the email and password set in Supabase Auth. Admins and moderators are redirected to `/admin`.

New client and provider registrations create their profiles automatically with non-admin roles. The admin payment review function and dashboard reads are protected by database role checks and row-level security.

---

## ☁️ Vercel Deployment

This is a Next.js App Router app. Vercel should use the **Next.js** framework preset and leave **Output Directory** empty so it serves `.next`, not a static folder.

1. Push this repository to GitHub/GitLab.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Confirm Framework Preset is **Next.js**, Root Directory is the repo root, and Output Directory is unset.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET` (server-only)
5. Click **Deploy**.

If this project was previously a Laravel/PHP app on the same Vercel project, change the preset to Next.js and clear any Output Directory such as `public` or `dist`, then redeploy.
