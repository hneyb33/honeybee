-- Public media read RLS fix.
--
-- Diagnosed live issue: the Escort images / Escort videos directories return 0
-- rows for logged-out visitors even though 203 profile_media rows exist and
-- their listings are verified. The public SELECT policy on profile_media is
-- either missing or role-restricted in the live database, so anon reads fall
-- back to the owner/admin policies only. This migration re-creates the policy
-- idempotently with explicit roles and confirms the base grants.
--
-- Run diagnostics (paste into the SQL editor after applying):
--   SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'profile_media';

ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profile_media TO anon, authenticated;
GRANT SELECT ON public.listings TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view media" ON public.profile_media;
CREATE POLICY "Public can view media"
    ON public.profile_media
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings l
            WHERE l.id = profile_media.listing_id
              AND l.verification_status = 'verified'
        )
    );
