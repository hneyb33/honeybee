Honeybee — Product Requirements Document (Adapted from Safari Stage)
===============================================================

Version: v1.0
Status: Draft — For Internal Review
Date: 2026-06-26
Prepared By: IDA Digital / GitHub Copilot (adapted)

CONFIDENTIAL — INTERNAL

1. Executive summary
--------------------
Honeybee is an evolution of the Honeybee codebase in this repository: a verified, admin-driven listings and booking platform tailored to the local market. This PRD adapts the Safari Stage strategy to Honeybee's existing structure and aims to deliver a secure, search-first marketplace with staged delivery across three phases: foundation, commerce, and scale.

Key outcomes for Phase 1 (Foundation):
- A verified directory of listings and profiles
- Admin verification workflow and Next.js `/admin` dashboard
- Fast, mobile-first discovery with role-based access

2. Product vision & goals
-------------------------
Vision: Make `honeybee` the primary, trusted discovery and booking platform for local listings (service providers, properties or talent depending on product focus) — simple for first-time smartphone users and powerful for professionals.

Business goals:
- Establish trust via ID verification and admin review
- Generate MRR via subscriptions and booking commissions in Phase 2
- Maintain strong uptime and data protection

3. Primary users & personas
---------------------------
- Providers: Individuals or businesses offering a service/listing. (Requires registration and verification.)
- Clients: Browsers and buyers who discover and book providers.
- Super Admin: Platform operators who approve verifications, manage disputes and view analytics.
- Agency / Manager: (Phase 2) represents multiple providers.
- Moderator: (Phase 2) content moderation and review tasks.

4. Functional requirements (core — Phase 1)
-----------------------------------------
4.1 Registration & verification
- Email/phone registration; collect DOB and upload government ID images (front/back).
- Block registrations with calculated age < 18.
- Uploaded documents stored encrypted in object storage.

4.2 Provider profiles
- Structured profile fields (name, stage/brand, location, skills, experience, gallery photos).
- Minimum portfolio photos (3) required to enter verification queue.
- Verification states: PENDING → UNDER REVIEW → VERIFIED / REJECTED / SUSPENDED.

4.3 Search & discovery
- Full-text search with filters (location, skill/type, availability, experience, tier).
- Postgres full-text / filtered discovery via Supabase; Meilisearch optional later for scale.
- Unverified profiles never appear in search results.

4.4 Admin verification dashboard
- Admin dashboard for processing submissions: side-by-side ID vs. photos, field-level approvals, audit log, SLA countdown.

5. Payments & bookings (Phase 2)
--------------------------------
- Full booking flow: brief submission, booking fee (configurable %), talent/provider acceptance, escrow and final payout.
- Recommended gateway: Flutterwave (MTN/Airtel/Card) and Pesapal (local fallback).
- Payouts via mobile money or bank transfer only to verified accounts.

6. Subscription & tiering
------------------------
- Provider tiers: Free / Standard / Premium with increasing profile visibility and media allowance.
- Client tiers: Free / Premium with booking capabilities and access to premium profiles.

7. Security, privacy & compliance
--------------------------------
- Store IDs and sensitive files encrypted in Supabase Storage or compatible object storage.
- Use Supabase Auth and row-level security for session and role/permission management.
- Admin 2FA mandatory; optional for providers/clients.
- Data export/deletion: comply with local Data Protection Act and honor requests within 30 days.

8. Technical architecture (recommended)
-------------------------------------
- App: Next.js 15 App Router on Vercel.
- Auth and database: Supabase (PostgreSQL, Auth, Storage, RLS).
- UI: React 19, Tailwind CSS, shadcn/ui.
- Search: Supabase filtered queries; Meilisearch optional later.
- File storage: Supabase Storage for photos; object storage for IDs (Phase 2).
- Deployment: Vercel (framework preset Next.js, default `.next` output).

9. Three-phase roadmap (summary)
--------------------------------
Phase 1 — Foundation (8–10 weeks)
- Authentication, profile builder, portfolio upload, admin verification queue, basic search, staging deployed.

Phase 2 — Commerce (8–10 weeks)
- Booking flows, payment gateway integration, subscriptions, payouts, reviews, notifications (SMS/WhatsApp).

Phase 3 — Scale & intelligence (10–14 weeks)
- Regionalisation, automated face verification, intelligent matching, mobile app, horizontal scaling.

10. Deliverables for immediate next work (short term)
---------------------------------------------------
- Create a `docs/honeybee-prd.md` file in the repo (this document)
- Seed 200 test provider profiles (for Phase 1 acceptance testing)
- Add admin verification workflow (pages + RLS policies)
- Wire up Meilisearch pilot for core listing pages

11. Implementation notes specific to this workspace
--------------------------------------------------
- Existing code structure includes controllers under `app/Http/Controllers` and domain folders such as `Escort`, `Listings`, `Property`. Use these as the starting models for mapping roles and permissions.
- Add Spatie permissions roles: `super_admin`, `moderator`, `agency`, `provider_free`, `provider_premium`, `client_free`, `client_premium`.
- Use existing factories in `database/factories` to seed test data for Phase 1.

12. Risks & mitigations
-----------------------
- Risk: Handling and storing government IDs increases legal risk. Mitigation: encrypt at rest, use signed short-lived URLs, and obtain legal sign-off for documents.
- Risk: Payment provider regional limitations. Mitigation: integrate at least two gateways (Flutterwave + Pesapal) and test in staging.

13. Budget & timeline (high level)
---------------------------------
- Phase 1 estimate: 8–10 weeks, budget range UGX 8,000,000 — 12,000,000 (adjust to local rates and team size).
- Add Vercel and Supabase hosting costs as in original strategy.

Appendix: Next actions
- Map existing models/routes to the roles listed above.
- Create admin verification screens and policies.
- Seed test data and deploy staging for client review.

---
This file was added automatically to provide a focused PRD for `honeybee` adapted from the Safari Stage blueprint. Review and tell me which areas you'd like me to expand (detailed data model, admin workflow, or CI/CD pipeline).
