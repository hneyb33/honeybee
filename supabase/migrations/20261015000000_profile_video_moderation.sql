ALTER TABLE public.profile_media
    ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'verified'
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profile_media
    ALTER COLUMN verification_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_profile_media_review_queue
    ON public.profile_media (verification_status, created_at DESC);

DROP POLICY IF EXISTS "Public can view media" ON public.profile_media;
CREATE POLICY "Public can view verified profile media" ON public.profile_media
    FOR SELECT USING (
        verification_status = 'verified'
        AND EXISTS (
            SELECT 1
            FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.verification_status = 'verified'
        )
    );

CREATE POLICY "Admins can review profile media" ON public.profile_media
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'honeybee-profile-media',
    'honeybee-profile-media',
    true,
    52428800,
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'profile_media'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_media';
    END IF;
END;
$$;
