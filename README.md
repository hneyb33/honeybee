# Honeybee 🐝

Uganda's verified platform for private specialists, culinary masters, and companions — built with **Next.js 15 (App Router)**, **React 19**, **shadcn/ui**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**, optimized for deployment on **Vercel**.

---

## 🌟 Key Features & Improvements

- **Airbnb-Inspired UX & Aesthetic**:
  - Interactive search capsule (`Where`, `Category`, `Service`, `Near you` geolocation distance calculation).
  - Horizontal tier bar (All, VIP, Premium, Specialists, Women, Men).
  - Listing cards with multi-photo slider, rating, favorite heart toggle, and upfront UGX hourly rates.
  - Signature Airbnb 5-photo mosaic layout on profile detail pages with full-screen lightbox.
- **Conversion & Experience Optimization (CRO/CXO)**:
  - Sticky bottom booking and direct chat bar (instant WhatsApp pre-filled message & Telegram link).
  - Interactive booking modal with live pricing breakdown (`UGX rate × duration hours`).
  - Client review submission dialog.
- **Rectified Business Logic**:
  - Unified currency to Ugandan Shillings (`UGX`).
  - Separation between Home Specialists (Chefs, Laundry, Massage) and Companions.
  - Strict verification gating: unverified profiles never appear in discovery.
  - Persistent 18+ age verification gate.
- **Provider Operations Hub (`/provider`)**:
  - Live availability switcher (🟢 Available / 🟡 Busy / ⚫ Offline).
  - Real-time job request queue with Accept/Decline actions.
  - Weekly schedule and earnings breakdown.
- **Multi-Step Onboarding Wizard (`/provider/onboarding`)**:
  - Resumable five-step flows for models, agencies, and home-service providers.
  - City/neighbourhood selectors, choice controls, availability, UGX rate increments, profile details, and required portfolio upload of at least one photo and one video (up to 9 photos and 3 videos).
  - JPEG, PNG, and WebP photos (10 MB each) and MP4, WebM, and QuickTime videos (100 MB each) are submitted together for profile review.
  - Provider-owned drafts stay private until admin verification; verified profiles load from Supabase on their public profile page.
- **Admin Moderation & Audit Queue (`/admin`)**:
  - Supabase Auth sign-in restricted to administrator and moderator roles.
  - Database-backed profile verification presents each profile's details, photos, and videos together for a single verify/reject decision; media is not approved independently.
  - Transaction-safe payment review that activates the related subscription.
  - Dashboard counts for profiles, bookings, and payments.
- **Provider media catalogues (`/escort-images`, `/escort-videos`)**:
  - Verified profiles from every provider category can appear in the photo and video galleries.
  - Profile pages show photos and submitted videos after the full profile is verified.
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
Add your Supabase project URL and anon/publishable key:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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
3. Run every SQL migration in `supabase/migrations/` in filename order. The latest migration, `20261020000000_profile_media_video_uploads.sql`, enables the supported video formats and uploads up to 100 MB.
4. (Optional) Run `supabase/seed.sql` to add sample listings and places.

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
5. Click **Deploy**.

If this project was previously a Laravel/PHP app on the same Vercel project, change the preset to Next.js and clear any Output Directory such as `public` or `dist`, then redeploy.
