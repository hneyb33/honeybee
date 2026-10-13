CREATE TABLE IF NOT EXISTS public.site_pages (
    page_key TEXT PRIMARY KEY CHECK (page_key IN ('faqs', 'privacy', 'terms', 'disclaimer')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- CREATE TABLE IF NOT EXISTS does not update a table created by an earlier
-- schema, so add any required columns before seeding the page rows.
ALTER TABLE public.site_pages
    ADD COLUMN IF NOT EXISTS page_key TEXT,
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Support installations where site_pages already uses page_key as its required
-- key, as well as installations created by an earlier slug-based version.
UPDATE public.site_pages
SET page_key = COALESCE(NULLIF(page_key, ''), NULLIF(slug, '')),
    slug = COALESCE(NULLIF(slug, ''), NULLIF(page_key, ''))
WHERE page_key IS NULL OR page_key = '' OR slug IS NULL OR slug = '';

ALTER TABLE public.site_pages
    ALTER COLUMN page_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS site_pages_page_key_unique_idx
    ON public.site_pages (page_key);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;

DROP POLICY IF EXISTS "Anyone can read published site pages" ON public.site_pages;
DROP POLICY IF EXISTS "Admins can create site pages" ON public.site_pages;
DROP POLICY IF EXISTS "Admins can update site pages" ON public.site_pages;
DROP POLICY IF EXISTS "Admins can delete site pages" ON public.site_pages;

CREATE POLICY "Anyone can read published site pages" ON public.site_pages
    FOR SELECT USING (true);

CREATE POLICY "Admins can create site pages" ON public.site_pages
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site pages" ON public.site_pages
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete site pages" ON public.site_pages
    FOR DELETE USING (public.is_admin());

INSERT INTO public.site_pages (page_key, title, content)
VALUES
    (
        'faqs',
        'Frequently asked questions',
        $page_content$How do I find a provider?
Browse the directory and use the location and service filters to find profiles that match what you are looking for.

What does a verified profile mean?
A verification badge means the profile has passed Honeybee's review process. It is not a guarantee of identity, conduct, or service quality.

Who can use Honeybee?
Honeybee is for adults aged 18 and older. Users must follow the platform terms and all applicable laws.

How can I get help?
Contact the Honeybee support team using the contact details in the footer.$page_content$
    ),
    (
        'privacy',
        'Privacy policy',
        $page_content$Honeybee ("we", "our", or "the platform") is committed to protecting your privacy. This policy describes how account data and information submitted to Honeybee are handled.

Identity verification documents
Identity documents and background information submitted for verification are used by authorized Honeybee administrators for review and fraud prevention. They are not intended for public display.

Client data and discretion
We limit the personal information shown on public profiles. Please avoid sharing sensitive personal information through public profile fields.

Cookies and age gate
Honeybee may use browser storage and cookies for age-gate preferences, session authentication, and site settings.$page_content$
    ),
    (
        'terms',
        'Terms of service',
        $page_content$By accessing, browsing, or listing on Honeybee, you agree to follow these terms and any applicable laws.

Eligibility
You must be at least 18 years old to access or use Honeybee.

Independent providers
Providers listed on Honeybee are independent and are not employees or agents of Honeybee. Users and providers are responsible for their own arrangements.

Subscriptions and payments
Any applicable fees, payment instructions, and subscription terms are shown during the relevant transaction. Users should review those details before paying.$page_content$
    ),
    (
        'disclaimer',
        'Disclaimer',
        $page_content$Honeybee is a discovery and advertising platform. Information in profiles and advertisements is supplied by account holders. A review or verification badge is not a guarantee of identity, conduct, qualifications, or service quality.

Independent providers
Providers are independent and are not employees, agents, or representatives of Honeybee. Any arrangement or payment between a user and a provider is made at their own discretion.

User responsibility
Honeybee is intended only for adults aged 18 or older. Users are responsible for complying with applicable laws and making their own decisions based on available information.

No professional advice or emergency service
Content on Honeybee is general information, not legal, medical, or financial advice. Honeybee is not an emergency service. Contact appropriate local emergency services if you are in immediate danger.

This disclaimer does not limit any rights or obligations that cannot lawfully be excluded.$page_content$
    )
ON CONFLICT (page_key) DO NOTHING;
