# Honeybee implementation plan

## 1. Objective

Turn the Honeybee PRD into a staged, production-ready product roadmap for the existing Laravel application. The work should prioritize trust, verification, and discovery first, then expand into commerce and scale.

## 2. Current-state assessment

The repository already has a strong foundation for a listing-first marketplace:

- Laravel 11 + Blade + Livewire + Tailwind + Vite are already in place.
- An Escort model and owner-focused controller already exist for profile creation and editing.
- Basic public pages and age-gate flow are already present.

### Key gaps vs. the PRD

- No formal verification workflow or admin moderation pipeline.
- No role and permission system for admin, moderator, agency, provider, and client roles.
- No bookings, payment escrow, or subscription flow.
- No search engine layer beyond basic views.
- No audit trail, compliance storage model, or document handling for IDs.
- No Filament admin resources or policy-based access control.

## 3. Implementation strategy

### Phase 0 — Discovery and architecture alignment

Goal: confirm the product scope and align the current codebase with the PRD.

Tasks:
- Review the existing Escort data model and owner workflow.
- Map PRD entities to Laravel models and migrations.
- Define the canonical statuses for profiles and bookings.
- Decide the initial feature boundary for Phase 1.
- Create a backlog of MVP and Phase 2 items.

Deliverables:
- Approved feature scope for Phase 1.
- Entity map for users, escorts, verification, bookings, subscriptions, and payments.
- Initial migration and model plan.

### Phase 1 — Foundation and trust

Goal: make Honeybee a trusted, verified discovery platform.

#### A. Authentication and account model
- Add role-based access control with Spatie Permission.
- Define roles:
  - super_admin
  - moderator
  - agency
  - provider_free
  - provider_premium
  - client_free
  - client_premium
- Introduce secure registration and profile onboarding for providers and clients.
- Add age verification enforcement and a clear onboarding status for new accounts.

#### B. Escort profile and verification workflow
- Extend the Escort model to support the PRD fields for:
  - legal name / display name
  - DOB and age
  - location
  - languages
  - services
  - portfolio media
  - verification status
  - tier and visibility
- Introduce verification states:
  - PENDING
  - UNDER_REVIEW
  - INFORMATION_REQUESTED
  - VERIFIED
  - SUSPENDED
  - REJECTED
- Add a verification submission flow with required media and identity documents.
- Create an admin queue with approval/rejection actions.

#### C. Admin experience
- Add Filament-based admin resources for escort verification.
- Implement policy-based access so only authorised users can verify or reject profiles.
- Add audit logging for moderation actions.
- Show SLA countdown and queue ordering for pending reviews.

#### D. Discovery and search
- Add a search layer for escort profiles.
- Support filters for location, category, gender, availability, and tier.
- Ensure unverified profiles never appear in public search results.
- Make the listing cards mobile-first and lightweight for first-time smartphone users.

#### E. Privacy and compliance readiness
- Create a storage strategy for sensitive documents.
- Encrypt or protect ID uploads at rest.
- Add support for export/deletion workflows and retention rules.
- Prepare the legal copy required by the PRD.

### Phase 2 — Commerce and booking

Goal: introduce paid bookings, subscriptions, and trust-based commerce.

#### A. Booking flow
- Add booking requests, briefs, and availability handling.
- Support booking fee collection and a booking state lifecycle.
- Implement escort acceptance and final settlement logic.
- Create a booking status schema:
  - ENQUIRY
  - FEE_PAID
  - CONFIRMED
  - IN_PROGRESS
  - PENDING_COMPLETION
  - COMPLETED
  - DISPUTED
  - CANCELLED

#### B. Payments and payouts
- Integrate a local payment gateway such as Flutterwave or Pesapal.
- Add escrow support for booking fees.
- Introduce payout rules for verified escorts only.
- Log transaction ids and handle idempotency.

#### C. Subscriptions and tiers
- Implement provider and client tiering.
- Add recurring subscription support where feasible.
- Gate visibility and media allowances by subscription tier.

#### D. Reviews and notifications
- Add review and rating collection after completed bookings.
- Send booking and verification notifications by email and WhatsApp/SMS where supported.

### Phase 3 — Scale and intelligence

Goal: improve reach, automation, and operational resilience.

- Add regional expansion support for additional countries and languages.
- Introduce automated face-match or document verification tools.
- Add analytics dashboards for revenue, booking volume, and moderation performance.
- Improve delivery reliability through CI/CD, staging, backups, and monitoring.

## 4. Recommended technical implementation order

### Step 1 — Prepare the data layer
- Add migrations for:
  - roles and permissions
  - verification status and audit trail
  - identity document storage metadata
  - booking records
  - subscription records
  - reviews and disputes

### Step 2 — Refactor the Escort domain
- Replace the current basic owner-only model workflow with a PRD-aligned profile lifecycle.
- Add computed visibility rules based on tier and verification state.

### Step 3 — Build the admin workflow
- Install and configure Filament.
- Create resources for escorts, bookings, reviews, and moderation actions.
- Add policies for each role.

### Step 4 — Improve public discovery
- Implement search and filtering for the home and listing pages.
- Ensure public pages only show verified listings.

### Step 5 — Introduce bookings and payments
- Add booking creation and review screens.
- Integrate payment gateway hooks and payout logic.

### Step 6 — Harden operations
- Add tests, backups, logging, performance tuning, and deployment automation.

## 5. Suggested backlog for the next implementation sprint

### Sprint 1: Foundation
- Add roles and permissions.
- Add Escort verification status and admin review queue.
- Build Filament verification screens.
- Add migration and seed data for test profiles.

### Sprint 2: Discovery
- Implement search and filters.
- Add public-only visibility rules.
- Improve the owner dashboard to show verification status and next actions.

### Sprint 3: Commerce
- Add booking flow and booking status lifecycle.
- Add payment integration stub and escrow logic.
- Create client and escort dashboards.

## 6. Acceptance criteria

The implementation is successful when:
- Only verified escorts appear in public discovery.
- Admin users can review and approve or reject profiles.
- Providers can update their profile and see their verification state.
- Clients can browse and book verified listings.
- Payments and booking fees are logged and auditable.
- The platform supports future scaling without a redesign.

## 7. Risks and mitigations

- Legal risk around identity documents: mitigate with encryption, limited access, and local legal review.
- Payment gateway complexity: start with a simple gateway-first implementation and keep the payment abstraction flexible.
- Scope creep: lock the first milestone to trust and discovery before adding bookings.
- Low digital literacy: keep the UI step-based, mobile-first, and icon-led.

## 8. Immediate next steps

1. Finalise the Phase 1 feature scope.
2. Add the roles and permissions foundation.
3. Introduce the Escort verification model and admin workflow.
4. Build the first version of the public search and listing experience.
5. Create tests around profile creation, visibility, and admin review actions.
