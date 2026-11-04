-- Cloudflare media pipeline (R2 + Stream)
--
-- Adds the second storage provider pair (`r2` for image originals/variants,
-- `stream` for Cloudflare Stream video) alongside the existing
-- `supabase`/`cloudinary` values, plus the columns the queue-driven processing
-- pipeline needs. Dual-read: historical rows are untouched and keep rendering
-- through their stored provider URLs.

-- profile_media ----------------------------------------------------------------
ALTER TABLE public.profile_media
    DROP CONSTRAINT IF EXISTS profile_media_storage_provider_check,
    ADD CONSTRAINT profile_media_storage_provider_check
        CHECK (storage_provider IN ('supabase', 'cloudinary', 'r2', 'stream'));

ALTER TABLE public.profile_media
    ADD COLUMN media_key TEXT,
    ADD COLUMN variant_prefix TEXT,
    ADD COLUMN stream_uid TEXT,
    ADD COLUMN blurhash TEXT,
    ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- New rows are keyed by their immutable R2 object key (or Stream video id for
-- legacy-compatible lookups); the unique indexes mirror the role
-- `cloudinary_public_id` played for the Cloudinary pipeline.
CREATE UNIQUE INDEX IF NOT EXISTS profile_media_media_key_idx
    ON public.profile_media (media_key);

CREATE UNIQUE INDEX IF NOT EXISTS profile_media_stream_uid_idx
    ON public.profile_media (stream_uid);

CREATE INDEX IF NOT EXISTS profile_media_moderation_idx
    ON public.profile_media (moderation_status)
    WHERE moderation_status <> 'approved';

-- ad_media ---------------------------------------------------------------------
ALTER TABLE public.ad_media
    DROP CONSTRAINT IF EXISTS ad_media_storage_provider_check,
    ADD CONSTRAINT ad_media_storage_provider_check
        CHECK (storage_provider IN ('supabase', 'cloudinary', 'r2', 'stream'));

ALTER TABLE public.ad_media
    ADD COLUMN media_key TEXT,
    ADD COLUMN variant_prefix TEXT,
    ADD COLUMN stream_uid TEXT,
    ADD COLUMN blurhash TEXT,
    ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS ad_media_media_key_idx
    ON public.ad_media (media_key);

CREATE UNIQUE INDEX IF NOT EXISTS ad_media_stream_uid_idx
    ON public.ad_media (stream_uid);

CREATE INDEX IF NOT EXISTS ad_media_moderation_idx
    ON public.ad_media (moderation_status)
    WHERE moderation_status <> 'approved';

-- media_upload_intents -----------------------------------------------------------
-- Intents used to be keyed to a Cloudinary public_id; the R2 presign flow keys
-- them to the object instead. `cloudinary_public_id` becomes nullable so new
-- (media_key) intents can be recorded without pretending to be Cloudinary ids.
ALTER TABLE public.media_upload_intents
    ALTER COLUMN cloudinary_public_id DROP NOT NULL;

ALTER TABLE public.media_upload_intents
    ADD COLUMN media_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS media_upload_intents_media_key_idx
    ON public.media_upload_intents (media_key);

-- Insert policies that hardcoded `supabase` now admit the Cloudflare providers
-- too. The API routes still write through the service-role key; this only keeps
-- direct client inserts (legacy dashboard code paths) honest about providers.
DROP POLICY IF EXISTS "Owners can add Supabase media to their listings" ON public.profile_media;
CREATE POLICY "Owners can add media to their listings"
    ON public.profile_media
    FOR INSERT
    WITH CHECK (
        storage_provider IN ('supabase', 'r2', 'stream')
        AND EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.profile_media.listing_id
              AND public.listings.user_id = auth.uid()
        )
    );
