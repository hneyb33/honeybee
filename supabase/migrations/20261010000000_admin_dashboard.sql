-- Keep the first admin account and all privileged actions controlled by Auth.
CREATE OR REPLACE FUNCTION public.is_admin()
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
          AND role IN ('super_admin', 'moderator')
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "Users and admins can view profiles" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can view all listings" ON public.listings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can review listings" ON public.listings
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view profile media" ON public.profile_media
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view bookings" ON public.bookings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view payments" ON public.payments
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view subscriptions" ON public.subscriptions
    FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    requested_kind text := NEW.raw_user_meta_data ->> 'account_kind';
    safe_kind text;
BEGIN
    safe_kind := CASE
        WHEN requested_kind IN ('specialist', 'model') THEN requested_kind
        ELSE 'client'
    END;

    INSERT INTO public.profiles (id, email, name, phone, account_kind, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(NEW.email, '@', 1)),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        safe_kind,
        CASE WHEN safe_kind IN ('specialist', 'model') THEN 'provider_free' ELSE 'client_free' END
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_create_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

CREATE OR REPLACE FUNCTION public.admin_review_payment(
    p_payment_id uuid,
    p_action text,
    p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    reviewed_payment public.payments%ROWTYPE;
    current_subscription_id uuid;
    normalized_period text;
    subscription_end timestamptz;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    IF p_action IS NULL OR p_action NOT IN ('verify', 'reject') THEN
        RAISE EXCEPTION 'Unsupported payment review action';
    END IF;

    SELECT *
    INTO reviewed_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND OR reviewed_payment.status <> 'submitted' THEN
        RAISE EXCEPTION 'Only a submitted payment can be reviewed';
    END IF;

    IF p_action = 'reject' THEN
        IF length(trim(COALESCE(p_rejection_reason, ''))) < 8 THEN
            RAISE EXCEPTION 'A rejection reason of at least 8 characters is required';
        END IF;

        UPDATE public.payments
        SET status = 'rejected',
            rejection_reason = trim(p_rejection_reason)
        WHERE id = reviewed_payment.id;
        RETURN;
    END IF;

    IF reviewed_payment.transaction_id IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.payments
        WHERE provider = reviewed_payment.provider
          AND transaction_id = reviewed_payment.transaction_id
          AND status = 'verified'
          AND id <> reviewed_payment.id
    ) THEN
        RAISE EXCEPTION 'This transaction has already been used';
    END IF;

    normalized_period := CASE WHEN reviewed_payment.period = 'daily' THEN 'daily' ELSE 'monthly' END;
    subscription_end := CASE
        WHEN normalized_period = 'daily' THEN now() + interval '1 day'
        ELSE now() + interval '1 month'
    END;

    SELECT id
    INTO current_subscription_id
    FROM public.subscriptions
    WHERE user_id = reviewed_payment.user_id
      AND plan = reviewed_payment.plan
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF current_subscription_id IS NULL THEN
        INSERT INTO public.subscriptions (user_id, plan, period, status, starts_at, ends_at)
        VALUES (
            reviewed_payment.user_id,
            reviewed_payment.plan,
            normalized_period,
            'active',
            now(),
            subscription_end
        )
        RETURNING id INTO current_subscription_id;
    ELSE
        UPDATE public.subscriptions
        SET period = normalized_period,
            status = 'active',
            starts_at = now(),
            ends_at = subscription_end
        WHERE id = current_subscription_id;
    END IF;

    UPDATE public.payments
    SET status = 'verified',
        verified_at = now(),
        verified_by = auth.uid(),
        subscription_id = current_subscription_id,
        rejection_reason = NULL
    WHERE id = reviewed_payment.id;

    IF reviewed_payment.plan IN ('specialist', 'escort_premium', 'escort_vip') THEN
        UPDATE public.profiles
        SET role = 'provider_premium'
        WHERE id = reviewed_payment.user_id
          AND account_kind IN ('specialist', 'model')
          AND role NOT IN ('super_admin', 'moderator');
    ELSIF reviewed_payment.plan = 'client_premium' THEN
        UPDATE public.profiles
        SET role = 'client_premium'
        WHERE id = reviewed_payment.user_id
          AND account_kind = 'client'
          AND role NOT IN ('super_admin', 'moderator');
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_payment(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(uuid, text, text) TO authenticated;
