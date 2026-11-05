-- Admin RBAC + audit + flags + dictionary write policies + analytics views.
-- Adds the plumbing the TailAdmin-style dashboard needs without disturbing
-- the existing admin RPCs (admin_publish_ad, admin_review_payment, etc.).

-- ---------------------------------------------------------------------------
-- Audit log (immutable, append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    before jsonb,
    after jsonb,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx
    ON public.admin_audit_log (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx
    ON public.admin_audit_log (actor_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit entries" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit entries" ON public.admin_audit_log
    FOR INSERT WITH CHECK (public.is_admin());

-- No UPDATE/DELETE policies: rows are immutable.

-- ---------------------------------------------------------------------------
-- Entity flags (users, listings, ads, payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity TEXT NOT NULL CHECK (entity IN ('profile', 'listing', 'ad', 'payment')),
    entity_id UUID NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('review', 'abuse', 'fraud', 'quality', 'legal')),
    reason TEXT NOT NULL,
    raised_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    raised_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution TEXT
);

CREATE INDEX IF NOT EXISTS admin_flags_open_idx
    ON public.admin_flags (entity, entity_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_flags_recent_idx
    ON public.admin_flags (raised_at DESC);

ALTER TABLE public.admin_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view flags" ON public.admin_flags;
CREATE POLICY "Admins can view flags" ON public.admin_flags
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can raise flags" ON public.admin_flags;
CREATE POLICY "Admins can raise flags" ON public.admin_flags
    FOR INSERT WITH CHECK (public.is_admin() AND raised_by = auth.uid());

DROP POLICY IF EXISTS "Admins can resolve flags" ON public.admin_flags;
CREATE POLICY "Admins can resolve flags" ON public.admin_flags
    FOR UPDATE USING (public.is_admin() AND resolved_at IS NULL)
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Audit helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_log(
    p_action text,
    p_entity text,
    p_entity_id uuid,
    p_before jsonb DEFAULT NULL,
    p_after jsonb DEFAULT NULL,
    p_reason text DEFAULT NULL
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

    INSERT INTO public.admin_audit_log (actor_id, actor_role, action, entity, entity_id, before, after, reason)
    VALUES (
        auth.uid(),
        (SELECT role FROM public.profiles WHERE id = auth.uid()),
        p_action,
        p_entity,
        p_entity_id,
        p_before,
        p_after,
        p_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_log(text, text, uuid, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_log(text, text, uuid, jsonb, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Flag RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_flag_entity(
    p_entity text,
    p_entity_id uuid,
    p_kind text,
    p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_flag_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    IF p_entity NOT IN ('profile', 'listing', 'ad', 'payment') THEN
        RAISE EXCEPTION 'Unsupported flag entity';
    END IF;
    IF p_kind NOT IN ('review', 'abuse', 'fraud', 'quality', 'legal') THEN
        RAISE EXCEPTION 'Unsupported flag kind';
    END IF;
    IF length(trim(COALESCE(p_reason, ''))) < 4 THEN
        RAISE EXCEPTION 'Flag reason requires at least 4 characters';
    END IF;

    INSERT INTO public.admin_flags (entity, entity_id, kind, reason, raised_by)
    VALUES (p_entity, p_entity_id, p_kind, trim(p_reason), auth.uid())
    RETURNING id INTO new_flag_id;

    PERFORM public.admin_log('flag.' || p_kind, p_entity, p_entity_id, NULL, NULL, p_reason);
    RETURN new_flag_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_flag(
    p_flag_id uuid,
    p_resolution text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    resolved_entity text;
    resolved_entity_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    IF length(trim(COALESCE(p_resolution, ''))) < 4 THEN
        RAISE EXCEPTION 'Resolution requires at least 4 characters';
    END IF;

    UPDATE public.admin_flags
    SET resolved_at = timezone('utc'::text, now()),
        resolved_by = auth.uid(),
        resolution = trim(p_resolution)
    WHERE id = p_flag_id AND resolved_at IS NULL
    RETURNING entity, entity_id INTO resolved_entity, resolved_entity_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Flag was not found or already resolved';
    END IF;

    PERFORM public.admin_log('flag.resolve', resolved_entity, resolved_entity_id, NULL, NULL, p_resolution);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_flag_entity(text, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_resolve_flag(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_flag_entity(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_flag(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Extend existing admin_update_ad to also stamp an audit row.
-- The prior definition lives in 20261101000000_ads.sql; we wrap it here.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_ad(p_ad_id uuid, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    before_row jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    SELECT to_jsonb(a) INTO before_row FROM public.ads AS a WHERE id = p_ad_id FOR UPDATE;
    IF before_row IS NULL THEN
        RAISE EXCEPTION 'Ad was not found';
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

    PERFORM public.admin_log(
        'ad.update',
        'ad',
        p_ad_id,
        before_row,
        (SELECT to_jsonb(a) FROM public.ads AS a WHERE id = p_ad_id),
        NULL
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- Moderate a listing (verification status + notes), audit-logged
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_moderate_listing(
    p_listing_id uuid,
    p_status text,
    p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    before_row jsonb;
    after_row jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;
    IF p_status NOT IN ('draft','pending','under_review','verified','rejected','suspended') THEN
        RAISE EXCEPTION 'Unsupported listing status';
    END IF;

    SELECT to_jsonb(l) INTO before_row FROM public.listings AS l WHERE id = p_listing_id FOR UPDATE;
    IF before_row IS NULL THEN
        RAISE EXCEPTION 'Listing was not found';
    END IF;

    UPDATE public.listings
    SET verification_status = p_status,
        verification_notes = COALESCE(p_notes, verification_notes)
    WHERE id = p_listing_id;

    SELECT to_jsonb(l) INTO after_row FROM public.listings AS l WHERE id = p_listing_id;
    PERFORM public.admin_log('listing.moderate', 'listing', p_listing_id, before_row, after_row, p_notes);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_moderate_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_moderate_listing(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Write policies for dictionary tables so /admin/services and /admin/domains
-- can actually edit them.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage escort service options" ON public.escort_service_options;
CREATE POLICY "Admins can manage escort service options" ON public.escort_service_options
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.escort_service_options TO authenticated;

DROP POLICY IF EXISTS "Admins can view all places" ON public.places;
CREATE POLICY "Admins can view all places" ON public.places
    FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage places" ON public.places;
CREATE POLICY "Admins can manage places" ON public.places
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.places TO authenticated;

-- ---------------------------------------------------------------------------
-- Analytics views (security-definer so anon/admin can read aggregates safely)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_v_revenue_daily
WITH (security_invoker = false)
AS
SELECT
    date_trunc('day', verified_at AT TIME ZONE 'utc')::date AS day,
    provider,
    currency,
    SUM(amount)::numeric AS total,
    COUNT(*)::int AS payments
FROM public.payments
WHERE status = 'verified' AND verified_at IS NOT NULL
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW public.admin_v_signups_daily
WITH (security_invoker = false)
AS
SELECT
    date_trunc('day', created_at AT TIME ZONE 'utc')::date AS day,
    account_kind,
    COUNT(*)::int AS signups
FROM public.profiles
GROUP BY 1, 2;

CREATE OR REPLACE VIEW public.admin_v_ad_status
WITH (security_invoker = false)
AS
SELECT
    status,
    payment_status,
    is_featured,
    COUNT(*)::int AS count
FROM public.ads
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW public.admin_v_booking_channels
WITH (security_invoker = false)
AS
SELECT
    channel,
    status,
    COUNT(*)::int AS count
FROM public.bookings
GROUP BY 1, 2;

CREATE OR REPLACE VIEW public.admin_v_media_pipeline
WITH (security_invoker = false)
AS
SELECT
    storage_provider,
    processing_status,
    COUNT(*)::int AS count
FROM (
    SELECT storage_provider, processing_status FROM public.profile_media
    UNION ALL
    SELECT storage_provider, processing_status FROM public.ad_media
) AS all_media
GROUP BY 1, 2;

GRANT SELECT ON
    public.admin_v_revenue_daily,
    public.admin_v_signups_daily,
    public.admin_v_ad_status,
    public.admin_v_booking_channels,
    public.admin_v_media_pipeline
TO authenticated;

REVOKE ALL ON public.admin_v_revenue_daily, public.admin_v_signups_daily,
    public.admin_v_ad_status, public.admin_v_booking_channels, public.admin_v_media_pipeline
FROM anon;
