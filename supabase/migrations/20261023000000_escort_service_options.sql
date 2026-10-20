CREATE TABLE IF NOT EXISTS public.escort_service_options (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order SMALLINT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.escort_service_options ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.escort_service_options TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view active escort service options" ON public.escort_service_options;
CREATE POLICY "Public can view active escort service options"
    ON public.escort_service_options
    FOR SELECT
    USING (is_active);

INSERT INTO public.escort_service_options (id, name, sort_order)
VALUES
    ('erotic-massage', 'Erotic massage', 1),
    ('couples', 'Couples', 2),
    ('gfe', 'GFE (Girlfriend experience)', 3),
    ('threesome', 'Threesome', 4),
    ('sex-toys', 'Sex toys', 5),
    ('extraball', 'Extraball (Having sex multiple times)', 6),
    ('domination', 'Domination', 7),
    ('lt', 'LT (Long Time; Usually overnight)', 8),
    ('phone-sex-video-calls', 'Phone sex & video calls', 9),
    ('o-level', 'O-Level (Oral sex, Blow job)', 10),
    ('cim', 'CIM (Come in mouth)', 11),
    ('party-travel-companion', 'Party & travel Companion', 12),
    ('body-to-body-nuru-massage', 'Body To Body Nuru massage', 13),
    ('dfk', 'DFK (Deep french kissing)', 14),
    ('western-jazz', 'Western jazz (Kachabali)', 15),
    ('striptease-lapdance', 'Striptease/Lapdance', 16),
    ('threesome-duo', 'Threesome (Duo)', 17),
    ('kabuzi', 'Kabuzi (Doggy style)', 18)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = true;
