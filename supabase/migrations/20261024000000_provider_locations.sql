WITH ranked_places AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY lower(area), lower(city)
            ORDER BY created_at, id
        ) AS row_number
    FROM public.places
)
DELETE FROM public.places
WHERE id IN (SELECT id FROM ranked_places WHERE row_number > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_area_city_unique
    ON public.places (lower(area), lower(city));

GRANT SELECT ON public.places TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_listing_location_to_places()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NULLIF(trim(NEW.city), '') IS NOT NULL
       AND NULLIF(trim(NEW.neighborhood), '') IS NOT NULL THEN
        INSERT INTO public.places (name, area, city, latitude, longitude)
        VALUES (
            trim(NEW.neighborhood),
            trim(NEW.neighborhood),
            trim(NEW.city),
            COALESCE(NEW.latitude, 0.347596),
            COALESCE(NEW.longitude, 32.582520)
        )
        ON CONFLICT (lower(area), lower(city)) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_add_location_to_places ON public.listings;
CREATE TRIGGER listings_add_location_to_places
    AFTER INSERT OR UPDATE OF city, neighborhood ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.add_listing_location_to_places();

INSERT INTO public.places (name, area, city, latitude, longitude)
SELECT DISTINCT ON (lower(neighborhood), lower(city))
    trim(neighborhood),
    trim(neighborhood),
    trim(city),
    COALESCE(latitude, 0.347596),
    COALESCE(longitude, 32.582520)
FROM public.listings
WHERE NULLIF(trim(city), '') IS NOT NULL
  AND NULLIF(trim(neighborhood), '') IS NOT NULL
ORDER BY lower(neighborhood), lower(city), created_at, id
ON CONFLICT (lower(area), lower(city)) DO NOTHING;
