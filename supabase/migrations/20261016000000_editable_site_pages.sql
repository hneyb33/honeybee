CREATE TABLE IF NOT EXISTS public.site_pages (
    page_key TEXT PRIMARY KEY CHECK (page_key IN ('privacy', 'terms', 'faqs', 'disclaimer')),
    title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
    content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 50000),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site pages" ON public.site_pages
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage site pages" ON public.site_pages
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

INSERT INTO public.site_pages (page_key, title, content)
VALUES
    (
        'privacy',
        'Privacy Policy',
        'Last updated: October 2026

Honeybee ("we", "our", or "the platform") is committed to protecting your privacy and confidential identity. This Privacy Policy details how we handle account data, identity verification documents, and communications in accordance with Uganda''s Data Protection and Privacy Act.

1. Identity Verification Documents
Government ID images (Ugandan National ID, NIN, Passport) and sensitive background checks submitted by providers are used strictly for manual accreditation and anti-fraud verification by authorized Honeybee administrators. They are stored securely and never published publicly, displayed to clients, or shared with third parties without legal process.

2. Client Data & Discretion
We do not expose client telephone numbers or exact residential locations to providers before formal booking confirmation. Messages initiated via WhatsApp and Telegram are end-to-end encrypted under the respective messaging networks.

3. Cookies & Age Gate
We use functional cookies to preserve your 18+ age verification consent, session authentication, and theme preferences.'
    ),
    (
        'terms',
        'Terms and Conditions',
        'Last updated: October 2026

Welcome to Honeybee. By accessing, browsing, or listing on our platform, you agree to comply with these Terms and Conditions.

1. Eligibility (Strict 18+ Rule)
You must be at least 18 years of age to access Honeybee. Any attempt by a minor to register or communicate will result in immediate permanent termination and reporting where required.

2. Independent Service Providers
Providers listed on Honeybee (including culinary chefs, domestic specialists, wellness therapists, and companions) are independent entities. Honeybee facilitates verified discovery, escrow, and reputation scoring.

3. Subscription & Payments
Listing and VIP membership fees are charged in Ugandan Shillings (UGX). All Mobile Money transactions are verified against the telecom transaction reference code before plan activation.'
    ),
    (
        'faqs',
        'Frequently Asked Questions',
        'How do I join Honeybee?
Create an account, complete your profile, and submit it for admin review. Verified profiles can appear in discovery.

How do I contact a model or service provider?
Open a verified profile, choose an available service, and use the WhatsApp or Telegram contact option provided.

How do subscriptions and payments work?
Choose a subscription plan and follow the payment instructions shown at checkout. Submitted payment details are reviewed before activation.

How do I report a concern?
Contact Honeybee support using the contact details on our Contact Us page. Include the profile or transaction details relevant to your report.'
    ),
    (
        'disclaimer',
        'Disclaimer',
        'Last updated: October 2026

Honeybee is a discovery and listing platform. Unless expressly stated otherwise, people and businesses listed on the platform are independent and are not employees, agents, or representatives of Honeybee.

Profile details and media are provided by users and reviewed according to platform processes. Verification is not a guarantee of a provider''s identity, qualifications, conduct, availability, or the quality or outcome of a service.

Users are responsible for making informed decisions, following applicable laws, and taking appropriate safety precautions when communicating or arranging services. Honeybee does not guarantee uninterrupted access, accuracy of user-submitted information, or any particular outcome from a connection made through the platform.

Contact Honeybee support to report inaccurate, unsafe, or prohibited content.'
    )
ON CONFLICT (page_key) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'site_pages'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.site_pages';
    END IF;
END;
$$;
