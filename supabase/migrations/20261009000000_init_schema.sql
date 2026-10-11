-- Honeybee Supabase Database Schema Migration
-- Comprehensive schema for verified listings, bookings, subscriptions, reviews, and places

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    phone_country TEXT DEFAULT '+256',
    account_kind TEXT NOT NULL DEFAULT 'client' CHECK (account_kind IN ('client', 'specialist', 'model', 'agency', 'admin')),
    role TEXT NOT NULL DEFAULT 'client_free' CHECK (role IN ('client_free', 'client_premium', 'provider_free', 'provider_premium', 'moderator', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. LISTINGS (Service Providers & Companions)
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL DEFAULT 'escort' CHECK (kind IN ('escort', 'service')),
    escort_tier TEXT NOT NULL DEFAULT 'premium' CHECK (escort_tier IN ('standard', 'premium', 'vip')),
    service_type TEXT,
    category TEXT NOT NULL DEFAULT 'female',
    age INTEGER,
    gender TEXT,
    ethnicity TEXT,
    nationality TEXT DEFAULT 'Ugandan',
    city TEXT NOT NULL DEFAULT 'Kampala',
    neighborhood TEXT NOT NULL DEFAULT 'Central',
    latitude DECIMAL(10, 7) DEFAULT 0.347596,
    longitude DECIMAL(10, 7) DEFAULT 32.582520,
    hourly_rate INTEGER NOT NULL DEFAULT 50000,
    monthly_price INTEGER DEFAULT 150000,
    currency TEXT NOT NULL DEFAULT 'UGX',
    summary_line TEXT,
    description TEXT NOT NULL,
    about_me TEXT,
    services_offered JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '["English", "Luganda"]'::jsonb,
    rates JSONB DEFAULT '{}'::jsonb,
    availability JSONB DEFAULT '[]'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('draft', 'pending', 'under_review', 'verified', 'rejected', 'suspended')),
    verification_notes TEXT,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    whatsapp_number TEXT,
    whatsapp_code TEXT DEFAULT '+256',
    telegram TEXT,
    telegram_code TEXT DEFAULT '+256',
    cover_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    experience_band TEXT,
    has_certificate BOOLEAN NOT NULL DEFAULT false,
    certificate_url TEXT,
    travel_km TEXT DEFAULT '10',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROFILE MEDIA (Photos, gallery, videos)
CREATE TABLE IF NOT EXISTS public.profile_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video')),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROFILE OFFERINGS (Structured service packages)
CREATE TABLE IF NOT EXISTS public.profile_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    pricing_model TEXT DEFAULT 'Fixed price',
    turnaround TEXT,
    location_type TEXT DEFAULT 'Client premises',
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PROFILE REFERENCES (Trust verification)
CREATE TABLE IF NOT EXISTS public.profile_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    referee_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    years_known INTEGER DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed')),
    token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    duration_hours SMALLINT NOT NULL DEFAULT 2,
    experience_type TEXT,
    note TEXT,
    channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'telegram')),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined', 'travelling', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed')),
    price_amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'UGX',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'monthly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. PAYMENTS (Mobile Money & Verification flow)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    plan TEXT NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    provider TEXT NOT NULL DEFAULT 'mtn_momo' CHECK (provider IN ('mtn_momo', 'airtel_money', 'bank_transfer', 'flutterwave', 'pesapal')),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UGX',
    merchant_code TEXT,
    payer_phone TEXT,
    transaction_id TEXT,
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, listing_id)
);

-- 12. PLACES (Kampala & Uganda coordinates for proximity search)
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Kampala',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_verification ON public.listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_listings_kind ON public.listings(kind);
CREATE INDEX IF NOT EXISTS idx_listings_escort_tier ON public.listings(escort_tier);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON public.bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Public can read verified listings
CREATE POLICY "Public can view verified listings" ON public.listings
    FOR SELECT USING (verification_status = 'verified');

-- Public can view places
CREATE POLICY "Public can view places" ON public.places
    FOR SELECT USING (true);

-- Public can view reviews for listings
CREATE POLICY "Public can view reviews" ON public.reviews
    FOR SELECT USING (true);

-- Public can view profile media of verified listings
CREATE POLICY "Public can view media" ON public.profile_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
            AND public.listings.verification_status = 'verified'
        )
    );

-- Public can view offerings of verified listings
CREATE POLICY "Public can view offerings" ON public.profile_offerings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_offerings.listing_id
            AND public.listings.verification_status = 'verified'
        )
    );
