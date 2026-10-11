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
  - Resumable five-step flows for models and home-service providers.
  - City/neighbourhood selectors, choice controls, availability, UGX rate increments, profile details, and portfolio photo upload.
  - Provider-owned drafts stay private until admin verification; verified profiles load from Supabase on their public profile page.
- **Admin Moderation & Audit Queue (`/admin`)**:
  - Supabase Auth sign-in restricted to administrator and moderator roles.
  - Database-backed profile verification and Mobile Money payment queues.
  - Transaction-safe payment review that activates the related subscription.
  - Dashboard counts for profiles, bookings, payments, and recently submitted media.

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
3. Run the migrations in order: `20261009000000_init_schema.sql`, `20261010000000_admin_dashboard.sql`, then `20261011000000_provider_onboarding.sql`.
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

This project is 100% ready for zero-config Vercel deployment:
1. Push this repository to GitHub/GitLab.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**!

---

## 🗄️ Legacy Architecture Reference
The previous PHP/Laravel application and migrations are preserved intact in `_legacy_laravel/` for historical data reference.
