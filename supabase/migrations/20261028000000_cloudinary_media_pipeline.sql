ALTER TABLE public.profile_media
    ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'supabase'
        CHECK (storage_provider IN ('supabase', 'cloudinary')),
    ADD COLUMN cloudinary_public_id TEXT,
    ADD COLUMN cloudinary_asset_id TEXT,
    ADD COLUMN original_filename TEXT,
    ADD COLUMN mime_type TEXT,
    ADD COLUMN bytes BIGINT,
    ADD COLUMN width INTEGER,
    ADD COLUMN height INTEGER,
    ADD COLUMN duration_seconds NUMERIC,
    ADD COLUMN card_url TEXT,
    ADD COLUMN detail_url TEXT,
    ADD COLUMN playback_url TEXT;

ALTER TABLE public.profile_media
    DROP CONSTRAINT IF EXISTS profile_media_processing_status_check,
    ADD CONSTRAINT profile_media_processing_status_check
        CHECK (processing_status IN ('pending', 'processing', 'ready', 'failed'));

CREATE UNIQUE INDEX profile_media_cloudinary_public_id_idx
    ON public.profile_media (cloudinary_public_id);

DROP POLICY IF EXISTS "Owners can add media to their listings" ON public.profile_media;
CREATE POLICY "Owners can add Supabase media to their listings"
    ON public.profile_media
    FOR INSERT
    WITH CHECK (
        storage_provider = 'supabase'
        AND EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );
