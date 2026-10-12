CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'super_admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    requested_kind text := NEW.raw_user_meta_data ->> 'account_kind';
    requested_advertiser_type text := NEW.raw_user_meta_data ->> 'advertiser_type';
    safe_kind text;
    safe_advertiser_type text;
    safe_role text;
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

    safe_role := CASE
        WHEN lower(NEW.email) = 'hneybee49@gmail.com' THEN 'super_admin'
        WHEN safe_kind IN ('specialist', 'model', 'agency') THEN 'provider_free'
        ELSE 'client_free'
    END;

    INSERT INTO public.profiles (id, email, name, phone, account_kind, advertiser_type, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(NEW.email, '@', 1)),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        safe_kind,
        safe_advertiser_type,
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

UPDATE public.profiles
SET role = 'super_admin'
WHERE lower(email) = 'hneybee49@gmail.com';

CREATE OR REPLACE FUNCTION public.admin_update_profile(
    p_user_id uuid,
    p_name text,
    p_phone text,
    p_account_kind text
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
    IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 1 AND 120 THEN
        RAISE EXCEPTION 'Name must contain 1 to 120 characters';
    END IF;
    IF p_phone IS NOT NULL AND length(trim(p_phone)) > 32 THEN
        RAISE EXCEPTION 'Phone number cannot exceed 32 characters';
    END IF;
    IF p_account_kind IS NULL OR p_account_kind NOT IN ('client', 'specialist', 'model', 'agency', 'admin') THEN
        RAISE EXCEPTION 'Unsupported account kind';
    END IF;

    UPDATE public.profiles
    SET name = trim(p_name),
        phone = NULLIF(trim(p_phone), ''),
        account_kind = p_account_kind
    WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    existing_role text;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Super admin access is required';
    END IF;

    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot change your own role';
    END IF;

    PERFORM id
    FROM public.profiles
    WHERE role = 'super_admin'
    ORDER BY id
    LIMIT 1
    FOR UPDATE;

    IF p_role IS NULL OR p_role NOT IN ('client_free', 'client_premium', 'provider_free', 'provider_premium', 'moderator', 'super_admin') THEN
        RAISE EXCEPTION 'Unsupported user role';
    END IF;

    SELECT role INTO existing_role
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile was not found';
    END IF;

    IF existing_role = 'super_admin'
       AND p_role <> 'super_admin'
       AND (SELECT count(*) FROM public.profiles WHERE role = 'super_admin') <= 1 THEN
        RAISE EXCEPTION 'The last super admin cannot be demoted';
    END IF;

    UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    existing_role text;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Super admin access is required';
    END IF;

    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot delete your own account';
    END IF;

    PERFORM id
    FROM public.profiles
    WHERE role = 'super_admin'
    ORDER BY id
    LIMIT 1
    FOR UPDATE;

    SELECT role INTO existing_role
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile was not found';
    END IF;

    IF existing_role = 'super_admin'
       AND (SELECT count(*) FROM public.profiles WHERE role = 'super_admin') <= 1 THEN
        RAISE EXCEPTION 'The last super admin cannot be deleted';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.payments
        WHERE user_id = p_user_id
          AND status = 'verified'
    ) THEN
        RAISE EXCEPTION 'Users with verified payments must be retained for financial audit';
    END IF;

    DELETE FROM public.profiles WHERE id = p_user_id;
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    DELETE FROM public.listings WHERE id = p_listing_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_listing_ad(
    p_listing_id uuid,
    p_featured boolean,
    p_tier text DEFAULT NULL,
    p_featured_until timestamptz DEFAULT NULL
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

    IF p_featured AND (
        p_tier IS NULL
        OR p_tier NOT IN ('premium', 'vip')
        OR p_featured_until IS NULL
        OR p_featured_until <= now()
    ) THEN
        RAISE EXCEPTION 'Featured ads require a valid tier and future expiry';
    END IF;

    UPDATE public.listings
    SET is_featured = p_featured,
        featured_tier = CASE WHEN p_featured THEN p_tier ELSE NULL END,
        featured_until = CASE WHEN p_featured THEN p_featured_until ELSE NULL END
    WHERE id = p_listing_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    payment_status text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    SELECT status INTO payment_status
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment was not found';
    END IF;
    IF payment_status = 'verified' THEN
        RAISE EXCEPTION 'Verified payments are retained for audit';
    END IF;

    DELETE FROM public.payments WHERE id = p_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(
    p_subscription_id uuid,
    p_status text
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
    IF p_status IS NULL OR p_status NOT IN ('active', 'expired', 'cancelled', 'pending') THEN
        RAISE EXCEPTION 'Unsupported subscription status';
    END IF;

    UPDATE public.subscriptions SET status = p_status WHERE id = p_subscription_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription was not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_subscription(p_subscription_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    DELETE FROM public.subscriptions WHERE id = p_subscription_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription was not found';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_profile(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_listing(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_listing_ad(uuid, boolean, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_payment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_subscription_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_listing_ad(uuid, boolean, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_subscription(uuid) TO authenticated;

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can delete listings" ON public.listings
    FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can delete unverified payments" ON public.payments
    FOR DELETE USING (public.is_admin() AND status <> 'verified');

DO $$
DECLARE
    table_name text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH table_name IN ARRAY ARRAY['profiles', 'listings', 'payments', 'subscriptions']
        LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public'
                  AND tablename = table_name
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
            END IF;
        END LOOP;
    END IF;
END;
$$;
