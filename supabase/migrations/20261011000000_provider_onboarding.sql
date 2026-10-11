ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS profile_details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE POLICY "Users can view their own listings" ON public.listings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Providers can create their own draft listings" ON public.listings
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND verification_status IN ('draft', 'pending')
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND (
                  (account_kind = 'model' AND kind = 'escort')
                  OR (account_kind = 'specialist' AND kind = 'service')
              )
        )
    );

CREATE POLICY "Providers can update their own unverified listings" ON public.listings
    FOR UPDATE USING (
        user_id = auth.uid()
        AND verification_status IN ('draft', 'pending', 'rejected')
    )
    WITH CHECK (
        user_id = auth.uid()
        AND verification_status IN ('draft', 'pending', 'rejected')
    );

CREATE POLICY "Owners can view their profile media" ON public.profile_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can add media to their listings" ON public.profile_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can remove media from their listings" ON public.profile_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'honeybee-profile-media',
    'honeybee-profile-media',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can view profile media objects" ON storage.objects
    FOR SELECT USING (bucket_id = 'honeybee-profile-media');

CREATE POLICY "Providers can upload to their own media folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'honeybee-profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Providers can delete their own media objects" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'honeybee-profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
