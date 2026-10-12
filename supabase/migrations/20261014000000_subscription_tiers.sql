CREATE OR REPLACE FUNCTION public.validate_subscription_tier_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    expected_amount integer;
    account_kind text;
BEGIN
    IF NEW.period <> 'monthly' THEN
        RAISE EXCEPTION 'Only monthly subscriptions are available';
    END IF;

    expected_amount := CASE NEW.plan
        WHEN 'client_premium' THEN 35000
        WHEN 'escort_vip' THEN 80000
        WHEN 'specialist' THEN 50000
        WHEN 'escort_premium' THEN 50000
        WHEN 'advertiser_premium' THEN 50000
        ELSE NULL
    END;

    IF expected_amount IS NULL THEN
        RAISE EXCEPTION 'Unsupported subscription tier';
    END IF;
    IF NEW.amount <> expected_amount OR NEW.currency <> 'UGX' THEN
        RAISE EXCEPTION 'Payment amount or currency does not match the selected monthly tier';
    END IF;

    IF (NEW.plan = 'advertiser_premium') <> (NEW.listing_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Advertising requires a listing; other tiers cannot include a listing';
    END IF;

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
