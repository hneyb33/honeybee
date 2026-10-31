-- Ads: a self-contained advertising placement, separate from provider profiles.
-- A profile (listings row) is who you are; an ad is a paid/featured placement
-- (Fast / Independent / Agency) with its own content, period and settlement.
-- The organic directory keeps reading `listings`; the featured ad spaces read
-- only published `ads`.

-- Keep updated_at fresh without touching every caller.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    ad_type TEXT NOT NULL CHECK (ad_type IN ('fast', 'independent', 'agency')),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    summary_line TEXT,
    description TEXT NOT NULL,
    city TEXT,
    neighborhood TEXT,
    country TEXT NOT NULL DEFAULT 'Uganda',
    contact_whatsapp_code TEXT DEFAULT '+256',
    contact_whatsapp_number TEXT,
    contact_telegram TEXT,
    links JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover_image TEXT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ends_at TIMESTAMPTZ,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    featured_tier TEXT CHECK (featured_tier IN ('premium', 'vip')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'expired')),
    moderation_notes TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'UGX',
    payment_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'submitted', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_featured_ends ON public.ads(is_featured, ends_at);
CREATE INDEX IF NOT EXISTS idx_ads_type ON public.ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_ads_city ON public.ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_user ON public.ads(user_id);

DROP TRIGGER IF EXISTS ads_set_updated_at ON public.ads;
CREATE TRIGGER ads_set_updated_at
    BEFORE UPDATE ON public.ads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ad media mirrors the Cloudinary delivery columns of `profile_media`, but keyed
-- to an ad so ad placements never pollute the provider portfolio.
CREATE TABLE IF NOT EXISTS public.ad_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video')),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    storage_provider TEXT NOT NULL DEFAULT 'cloudinary'
        CHECK (storage_provider IN ('supabase', 'cloudinary')),
    cloudinary_public_id TEXT,
    cloudinary_asset_id TEXT,
    original_filename TEXT,
    original_url TEXT,
    mime_type TEXT,
    bytes BIGINT,
    width INTEGER,
    height INTEGER,
    duration_seconds NUMERIC,
    card_url TEXT,
    detail_url TEXT,
    playback_url TEXT,
    processing_status TEXT NOT NULL DEFAULT 'ready'
        CHECK (processing_status IN ('pending', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ad_media_ad ON public.ad_media(ad_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS ad_media_cloudinary_public_id_idx
    ON public.ad_media (cloudinary_public_id);

-- Link a payment to the ad it settles (mirrors payments.listing_id).
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL;

-- ROW LEVEL SECURITY -------------------------------------------------------
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published ads" ON public.ads;
CREATE POLICY "Public can view published ads" ON public.ads
    FOR SELECT USING (
        status = 'published'
        AND (ends_at IS NULL OR ends_at > timezone('utc'::text, now()))
    );

DROP POLICY IF EXISTS "Owners can view their own ads" ON public.ads;
CREATE POLICY "Owners can view their own ads" ON public.ads
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can create their own ads" ON public.ads;
CREATE POLICY "Owners can create their own ads" ON public.ads
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND status IN ('draft', 'pending')
    );

DROP POLICY IF EXISTS "Owners can update their own un-published ads" ON public.ads;
CREATE POLICY "Owners can update their own un-published ads" ON public.ads
    FOR UPDATE USING (
        user_id = auth.uid()
        AND status IN ('draft', 'pending', 'rejected')
    )
    WITH CHECK (
        user_id = auth.uid()
        AND status IN ('draft', 'pending', 'rejected')
    );

DROP POLICY IF EXISTS "Owners can delete their own drafts" ON public.ads;
CREATE POLICY "Owners can delete their own drafts" ON public.ads
    FOR DELETE USING (user_id = auth.uid() AND status = 'draft');

DROP POLICY IF EXISTS "Admins can view all ads" ON public.ads;
CREATE POLICY "Admins can view all ads" ON public.ads
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update ads" ON public.ads;
CREATE POLICY "Admins can update ads" ON public.ads
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete ads" ON public.ads;
CREATE POLICY "Admins can delete ads" ON public.ads
    FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view ad media" ON public.ad_media;
CREATE POLICY "Public can view ad media" ON public.ad_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ads a
            WHERE a.id = public.ad_media.ad_id
              AND a.status = 'published'
              AND (a.ends_at IS NULL OR a.ends_at > timezone('utc'::text, now()))
        )
    );

DROP POLICY IF EXISTS "Admins can manage ad media" ON public.ad_media;
CREATE POLICY "Admins can manage ad media" ON public.ad_media
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ADMIN RPCs (SECURITY DEFINER) --------------------------------------------
-- All admin ad mutations go through these, so the anon client never hits an RLS
-- WITH CHECK. This is the root fix for "new row violates row-level security
-- policy for table listings" style publish failures.

CREATE OR REPLACE FUNCTION public.admin_publish_ad(p_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    UPDATE public.ads
    SET status = 'published', moderation_notes = NULL
    WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_ad(p_ad_id uuid, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    UPDATE public.ads
    SET status = 'rejected', moderation_notes = p_notes
    WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ad_placement(
    p_ad_id uuid,
    p_featured boolean,
    p_tier text DEFAULT NULL,
    p_starts_at timestamptz DEFAULT NULL,
    p_ends_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    IF p_featured AND (p_tier IS NULL OR p_tier NOT IN ('premium', 'vip')) THEN
        RAISE EXCEPTION 'Featured ads require a valid tier';
    END IF;

    UPDATE public.ads
    SET is_featured = p_featured,
        featured_tier = CASE WHEN p_featured THEN p_tier ELSE NULL END,
        starts_at = COALESCE(p_starts_at, starts_at),
        ends_at = p_ends_at
    WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_settle_ad_payment(
    p_ad_id uuid,
    p_payment_status text,
    p_payment_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    IF p_payment_status NOT IN ('unpaid', 'submitted', 'verified', 'rejected') THEN
        RAISE EXCEPTION 'Unsupported payment status';
    END IF;

    UPDATE public.ads SET payment_status = p_payment_status WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;

    IF p_payment_id IS NOT NULL THEN
        UPDATE public.payments
        SET ad_id = p_ad_id,
            status = CASE WHEN p_payment_status = 'verified' THEN 'verified' ELSE status END,
            verified_at = CASE WHEN p_payment_status = 'verified' THEN timezone('utc'::text, now()) ELSE verified_at END,
            verified_by = CASE WHEN p_payment_status = 'verified' THEN auth.uid() ELSE verified_by END
        WHERE id = p_payment_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_ad(p_ad_id uuid, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    UPDATE public.ads
    SET ad_type = COALESCE(p_data->>'ad_type', ad_type),
        title = COALESCE(p_data->>'title', title),
        category = COALESCE(p_data->>'category', category),
        summary_line = COALESCE(p_data->>'summary_line', summary_line),
        description = COALESCE(p_data->>'description', description),
        city = COALESCE(p_data->>'city', city),
        neighborhood = COALESCE(p_data->>'neighborhood', neighborhood),
        country = COALESCE(p_data->>'country', country),
        contact_whatsapp_code = COALESCE(p_data->>'contact_whatsapp_code', contact_whatsapp_code),
        contact_whatsapp_number = COALESCE(p_data->>'contact_whatsapp_number', contact_whatsapp_number),
        contact_telegram = COALESCE(p_data->>'contact_telegram', contact_telegram),
        cover_image = COALESCE(p_data->>'cover_image', cover_image),
        links = COALESCE(p_data->'links', links),
        status = CASE
            WHEN p_data->>'status' IN ('draft','pending','published','rejected','expired')
            THEN p_data->>'status' ELSE status END,
        moderation_notes = COALESCE(p_data->>'moderation_notes', moderation_notes)
    WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_ad(p_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    DELETE FROM public.ads WHERE id = p_ad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ad was not found';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_publish_ad(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_ad(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_ad_placement(uuid, boolean, text, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_settle_ad_payment(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_ad(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_ad(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_publish_ad(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_ad(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_ad_placement(uuid, boolean, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_settle_ad_payment(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_ad(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_ad(uuid) TO authenticated;
