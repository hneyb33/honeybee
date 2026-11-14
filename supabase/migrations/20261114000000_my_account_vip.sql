-- My Account + Premium/VIP onboarding.
-- 1. The registration tier (premium vs VIP) chosen on /register.
-- 2. Owner-side self-service writes (profile identity RPC, verified-listing
--    edits that re-enter moderation instead of silently no-opping).
-- 3. can_view_vip(): is the current viewer allowed to see VIP profiles sharp?

-- ---------------------------------------------------------------------------
-- profiles.model_tier: 'premium' | 'vip' for model/agency accounts.
-- listings.escort_tier already allows ('standard','premium','vip'); onboarding
-- mirrors this column into the listing on every save.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS model_tier TEXT NOT NULL DEFAULT 'premium'
        CHECK (model_tier IN ('premium', 'vip'));

-- Re-register the signup trigger function so it also stores the tier that
-- /register puts into raw_user_meta_data. Body matches the 20261025 version.
CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    requested_kind text := NEW.raw_user_meta_data ->> 'account_kind';
    requested_advertiser_type text := NEW.raw_user_meta_data ->> 'advertiser_type';
    requested_country text := NEW.raw_user_meta_data ->> 'country';
    requested_model_tier text := NEW.raw_user_meta_data ->> 'model_tier';
    safe_kind text;
    safe_advertiser_type text;
    safe_role text;
    safe_country text;
    safe_phone_country text;
    safe_model_tier text;
BEGIN
    safe_kind := CASE
        WHEN requested_kind IN ('specialist', 'model', 'agency') THEN requested_kind
        ELSE 'client'
    END;

    safe_advertiser_type := CASE
        WHEN safe_kind = 'agency' THEN 'agency'
        WHEN safe_kind = 'model' AND requested_advertiser_type IN ('fast', 'independent') THEN requested_advertiser_type
        ELSE NULL
    END;

    safe_model_tier := CASE
        WHEN requested_model_tier = 'vip' THEN 'vip'
        ELSE 'premium'
    END;

    safe_country := CASE
        WHEN requested_country IN (
            'Uganda', 'Kenya', 'Tanzania', 'Democratic Republic of the Congo',
            'Rwanda', 'Burundi', 'South Sudan'
        ) THEN requested_country
        ELSE 'Uganda'
    END;

    safe_phone_country := CASE safe_country
        WHEN 'Kenya' THEN '+254'
        WHEN 'Tanzania' THEN '+255'
        WHEN 'Democratic Republic of the Congo' THEN '+243'
        WHEN 'Rwanda' THEN '+250'
        WHEN 'Burundi' THEN '+257'
        WHEN 'South Sudan' THEN '+211'
        ELSE '+256'
    END;

    safe_role := CASE
        WHEN lower(NEW.email) = 'hneybee49@gmail.com' THEN 'super_admin'
        WHEN safe_kind IN ('specialist', 'model', 'agency') THEN 'provider_free'
        ELSE 'client_free'
    END;

    INSERT INTO public.profiles (
        id, email, name, phone, phone_country, country, account_kind, advertiser_type, model_tier, role
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(NEW.email, '@', 1)),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        safe_phone_country,
        safe_country,
        safe_kind,
        safe_advertiser_type,
        safe_model_tier,
        safe_role
    )
    ON CONFLICT (id) DO UPDATE
    SET role = CASE
        WHEN lower(EXCLUDED.email) = 'hneybee49@gmail.com' THEN 'super_admin'
        ELSE public.profiles.role
    END;

    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Owner self-service profile update. profiles has no owner UPDATE policy by
-- design (self-signup rows are the domain of this RPC), so My Account edits
-- name/phone/tier through a definer that can only touch auth.uid().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_own_profile(
    p_name text,
    p_phone text,
    p_model_tier text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in';
    END IF;

    UPDATE public.profiles
    SET
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        phone = COALESCE(p_phone, phone),
        model_tier = CASE
            WHEN p_model_tier IN ('premium', 'vip') THEN p_model_tier
            ELSE model_tier
        END
    WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_profile(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- VIP visibility gate: admins and clients with an active client_premium
-- subscription see VIP profiles sharp. The owner check is done client-side
-- (viewer id vs listing user_id), so this stays a single cached per-page call.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_vip()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.is_admin(), false)
        OR EXISTS (
            SELECT 1
            FROM public.subscriptions s
            WHERE s.user_id = auth.uid()
              AND s.plan = 'client_premium'
              AND s.status = 'active'
              AND (s.ends_at IS NULL OR s.ends_at > timezone('utc'::text, now()))
        );
$$;

REVOKE ALL ON FUNCTION public.can_view_vip() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_vip() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Providers may now edit their own VERIFIED listings, but every owner write
-- must land the row in draft/pending/rejected - an edit re-enters moderation
-- instead of the previous silent no-op (UPDATE matched zero rows under the old
-- USING clause and PostgREST reported success).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Providers can update their own unverified listings" ON public.listings;
CREATE POLICY "Providers can update their own listings" ON public.listings
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND verification_status IN ('draft', 'pending', 'rejected')
    );
