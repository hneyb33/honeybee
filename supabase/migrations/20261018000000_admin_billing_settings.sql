CREATE TABLE IF NOT EXISTS public.payment_provider_settings (
    provider TEXT PRIMARY KEY CHECK (provider IN ('mtn_momo', 'airtel_money')),
    merchant_code TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subscription_plan_prices (
    plan TEXT PRIMARY KEY CHECK (
        plan IN ('client_premium', 'escort_vip', 'specialist', 'escort_premium', 'advertiser_premium')
    ),
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'UGX' CHECK (currency = 'UGX'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.payment_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plan_prices ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.payment_provider_settings, public.subscription_plan_prices TO anon, authenticated;
GRANT INSERT, UPDATE ON public.payment_provider_settings, public.subscription_plan_prices TO authenticated;

DROP POLICY IF EXISTS "Public can view payment provider settings" ON public.payment_provider_settings;
DROP POLICY IF EXISTS "Admins can manage payment provider settings" ON public.payment_provider_settings;
DROP POLICY IF EXISTS "Public can view subscription plan prices" ON public.subscription_plan_prices;
DROP POLICY IF EXISTS "Admins can manage subscription plan prices" ON public.subscription_plan_prices;

CREATE POLICY "Public can view payment provider settings"
    ON public.payment_provider_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage payment provider settings"
    ON public.payment_provider_settings FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view subscription plan prices"
    ON public.subscription_plan_prices FOR SELECT USING (true);
CREATE POLICY "Admins can manage subscription plan prices"
    ON public.subscription_plan_prices FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.payment_provider_settings (provider, merchant_code)
VALUES ('mtn_momo', '600492'), ('airtel_money', '')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO public.subscription_plan_prices (plan, amount, currency)
VALUES
    ('client_premium', 35000, 'UGX'),
    ('escort_vip', 80000, 'UGX'),
    ('specialist', 50000, 'UGX'),
    ('escort_premium', 50000, 'UGX'),
    ('advertiser_premium', 50000, 'UGX')
ON CONFLICT (plan) DO NOTHING;

CREATE OR REPLACE FUNCTION public.validate_subscription_tier_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    expected_amount integer;
    account_kind text;
    active_plan boolean;
    configured_merchant_code text;
BEGIN
    IF NEW.period <> 'monthly' THEN
        RAISE EXCEPTION 'Only monthly subscriptions are available';
    END IF;

    SELECT price.amount, price.is_active
    INTO expected_amount, active_plan
    FROM public.subscription_plan_prices AS price
    WHERE price.plan = NEW.plan;

    IF expected_amount IS NULL OR active_plan IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Unsupported or inactive subscription tier';
    END IF;
    IF NEW.amount <> expected_amount OR NEW.currency <> 'UGX' THEN
        RAISE EXCEPTION 'Payment amount or currency does not match the selected monthly tier';
    END IF;

    IF (NEW.plan = 'advertiser_premium') <> (NEW.listing_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Advertising requires a listing; other tiers cannot include a listing';
    END IF;

    SELECT provider_setting.merchant_code
    INTO configured_merchant_code
    FROM public.payment_provider_settings AS provider_setting
    WHERE provider_setting.provider = NEW.provider;

    IF configured_merchant_code IS NULL OR btrim(configured_merchant_code) = '' THEN
        RAISE EXCEPTION 'Merchant code is not configured for the selected payment provider';
    END IF;
    NEW.merchant_code := configured_merchant_code;

    SELECT profile.account_kind
    INTO account_kind
    FROM public.profiles AS profile
    WHERE profile.id = NEW.user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'A Honeybee profile is required to purchase a subscription';
    END IF;

    IF NEW.plan = 'client_premium' AND account_kind <> 'client' THEN
        RAISE EXCEPTION 'Client VIP Access is only available to client accounts';
    ELSIF NEW.plan IN ('escort_vip', 'escort_premium') AND account_kind NOT IN ('model', 'agency') THEN
        RAISE EXCEPTION 'Model tiers are only available to model and agency accounts';
    ELSIF NEW.plan = 'specialist' AND account_kind <> 'specialist' THEN
        RAISE EXCEPTION 'Service Provider is only available to specialist accounts';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_subscription_tier_payment ON public.payments;
CREATE TRIGGER validate_subscription_tier_payment
    BEFORE INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_subscription_tier_payment();

REVOKE ALL ON FUNCTION public.validate_subscription_tier_payment() FROM PUBLIC;
