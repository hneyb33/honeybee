ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Uganda';

ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Uganda';

ALTER TABLE public.places
    ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Uganda';

CREATE INDEX IF NOT EXISTS idx_listings_country_city
    ON public.listings (country, city);

DROP INDEX IF EXISTS public.idx_places_area_city_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_country_area_city_unique
    ON public.places (country, lower(area), lower(city));

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
    safe_kind text;
    safe_advertiser_type text;
    safe_role text;
    safe_country text;
    safe_phone_country text;
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
        id, email, name, phone, phone_country, country, account_kind, advertiser_type, role
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

CREATE OR REPLACE FUNCTION public.add_listing_location_to_places()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NULLIF(trim(NEW.city), '') IS NOT NULL
       AND NULLIF(trim(NEW.neighborhood), '') IS NOT NULL THEN
        INSERT INTO public.places (name, area, city, country, latitude, longitude)
        VALUES (
            trim(NEW.neighborhood),
            trim(NEW.neighborhood),
            trim(NEW.city),
            COALESCE(NULLIF(trim(NEW.country), ''), 'Uganda'),
            COALESCE(NEW.latitude, 0.347596),
            COALESCE(NEW.longitude, 32.582520)
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_add_location_to_places ON public.listings;
CREATE TRIGGER listings_add_location_to_places
    AFTER INSERT OR UPDATE OF city, neighborhood, country ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.add_listing_location_to_places();

INSERT INTO public.places (name, area, city, country, latitude, longitude)
VALUES
    ('Nairobi', 'Nairobi', 'Nairobi', 'Kenya', -1.286, 36.817),
    ('Mombasa', 'Mombasa', 'Mombasa', 'Kenya', -4.043, 39.668),
    ('Kisumu', 'Kisumu', 'Kisumu', 'Kenya', -0.102, 34.761),
    ('Nakuru', 'Nakuru', 'Nakuru', 'Kenya', -0.303, 36.08),
    ('Eldoret', 'Eldoret', 'Eldoret', 'Kenya', 0.514, 35.269),
    ('Thika', 'Thika', 'Thika', 'Kenya', -1.033, 37.069),
    ('Naivasha', 'Naivasha', 'Naivasha', 'Kenya', -0.717, 36.431),
    ('Malindi', 'Malindi', 'Malindi', 'Kenya', -3.219, 40.117),
    ('Dar es Salaam', 'Dar es Salaam', 'Dar es Salaam', 'Tanzania', -6.792, 39.208),
    ('Dodoma', 'Dodoma', 'Dodoma', 'Tanzania', -6.163, 35.751),
    ('Arusha', 'Arusha', 'Arusha', 'Tanzania', -3.386, 36.683),
    ('Mwanza', 'Mwanza', 'Mwanza', 'Tanzania', -2.516, 32.917),
    ('Zanzibar City', 'Zanzibar City', 'Zanzibar City', 'Tanzania', -6.165, 39.199),
    ('Mbeya', 'Mbeya', 'Mbeya', 'Tanzania', -8.91, 33.46),
    ('Morogoro', 'Morogoro', 'Morogoro', 'Tanzania', -6.823, 37.662),
    ('Tanga', 'Tanga', 'Tanga', 'Tanzania', -5.068, 39.098),
    ('Kinshasa', 'Kinshasa', 'Kinshasa', 'Democratic Republic of the Congo', -4.322, 15.307),
    ('Lubumbashi', 'Lubumbashi', 'Lubumbashi', 'Democratic Republic of the Congo', -11.664, 27.479),
    ('Goma', 'Goma', 'Goma', 'Democratic Republic of the Congo', -1.679, 29.223),
    ('Bukavu', 'Bukavu', 'Bukavu', 'Democratic Republic of the Congo', -2.508, 28.86),
    ('Kisangani', 'Kisangani', 'Kisangani', 'Democratic Republic of the Congo', 0.516, 25.191),
    ('Mbuji-Mayi', 'Mbuji-Mayi', 'Mbuji-Mayi', 'Democratic Republic of the Congo', -6.136, 23.589),
    ('Matadi', 'Matadi', 'Matadi', 'Democratic Republic of the Congo', -5.817, 13.45),
    ('Kigali', 'Kigali', 'Kigali', 'Rwanda', -1.944, 30.061),
    ('Huye', 'Huye', 'Huye', 'Rwanda', -2.596, 29.739),
    ('Musanze', 'Musanze', 'Musanze', 'Rwanda', -1.499, 29.635),
    ('Rubavu', 'Rubavu', 'Rubavu', 'Rwanda', -1.678, 29.263),
    ('Muhanga', 'Muhanga', 'Muhanga', 'Rwanda', -2.085, 29.752),
    ('Rusizi', 'Rusizi', 'Rusizi', 'Rwanda', -2.484, 28.907),
    ('Bujumbura', 'Bujumbura', 'Bujumbura', 'Burundi', -3.382, 29.36),
    ('Gitega', 'Gitega', 'Gitega', 'Burundi', -3.427, 29.925),
    ('Ngozi', 'Ngozi', 'Ngozi', 'Burundi', -2.907, 29.83),
    ('Rumonge', 'Rumonge', 'Rumonge', 'Burundi', -3.973, 29.438),
    ('Muyinga', 'Muyinga', 'Muyinga', 'Burundi', -2.845, 30.342),
    ('Bururi', 'Bururi', 'Bururi', 'Burundi', -3.948, 29.624),
    ('Juba', 'Juba', 'Juba', 'South Sudan', 4.859, 31.571),
    ('Wau', 'Wau', 'Wau', 'South Sudan', 7.701, 27.996),
    ('Malakal', 'Malakal', 'Malakal', 'South Sudan', 9.533, 31.66),
    ('Bor', 'Bor', 'Bor', 'South Sudan', 6.208, 31.56),
    ('Yei', 'Yei', 'Yei', 'South Sudan', 4.095, 30.678),
    ('Aweil', 'Aweil', 'Aweil', 'South Sudan', 8.77, 27.397),
    ('Kawempe', 'Kawempe', 'Kampala', 'Uganda', 0.404, 32.566)
ON CONFLICT DO NOTHING;
