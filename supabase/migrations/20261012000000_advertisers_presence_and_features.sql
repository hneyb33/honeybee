ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS advertiser_type TEXT
        CHECK (advertiser_type IN ('fast', 'independent', 'agency'));

ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS advertiser_type TEXT
        CHECK (advertiser_type IN ('fast', 'independent', 'agency')),
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS featured_tier TEXT
        CHECK (featured_tier IN ('premium', 'vip')),
    ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Providers can create their own draft listings" ON public.listings;
CREATE POLICY "Providers and agencies can create their own draft listings" ON public.listings
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND verification_status IN ('draft', 'pending')
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND (
                  (account_kind IN ('model', 'agency') AND kind = 'escort')
                  OR (account_kind = 'specialist' AND kind = 'service')
              )
        )
    );

CREATE POLICY "Users can create their own payments" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND status IN ('pending', 'submitted')
        AND (
            listing_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.listings
                WHERE id = listing_id
                  AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_listing_presence(p_online boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in is required to update provider presence';
    END IF;

    UPDATE public.listings
    SET last_seen_at = CASE WHEN p_online THEN now() ELSE NULL END
    WHERE user_id = auth.uid()
      AND verification_status = 'verified';
END;
$$;

REVOKE ALL ON FUNCTION public.set_listing_presence(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_listing_presence(boolean) TO authenticated;

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

    INSERT INTO public.profiles (id, email, name, phone, account_kind, advertiser_type, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(NEW.email, '@', 1)),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        safe_kind,
        safe_advertiser_type,
        CASE WHEN safe_kind IN ('specialist', 'model', 'agency') THEN 'provider_free' ELSE 'client_free' END
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

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
    updated_listing_count integer;
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

    IF reviewed_payment.listing_id IS NOT NULL THEN
        IF reviewed_payment.plan NOT IN ('escort_vip', 'escort_premium', 'advertiser_vip', 'advertiser_premium') THEN
            RAISE EXCEPTION 'This plan cannot feature a listing';
        END IF;

        UPDATE public.listings
        SET featured_tier = CASE
                WHEN reviewed_payment.plan IN ('escort_vip', 'advertiser_vip') THEN 'vip'
                WHEN reviewed_payment.plan IN ('escort_premium', 'advertiser_premium') THEN 'premium'
                ELSE NULL
            END,
            is_featured = true,
            featured_until = now() + CASE
                WHEN reviewed_payment.period = 'daily' THEN interval '1 day'
                ELSE interval '1 month'
            END
        WHERE id = reviewed_payment.listing_id
          AND user_id = reviewed_payment.user_id;

        GET DIAGNOSTICS updated_listing_count = ROW_COUNT;
        IF updated_listing_count = 0 THEN
            RAISE EXCEPTION 'The listing for this feature payment no longer exists';
        END IF;

        UPDATE public.payments
        SET status = 'verified',
            verified_at = now(),
            verified_by = auth.uid(),
            rejection_reason = NULL
        WHERE id = reviewed_payment.id;
        RETURN;
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
          AND account_kind IN ('specialist', 'model', 'agency')
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
