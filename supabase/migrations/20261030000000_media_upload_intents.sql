-- Media upload intents
--
-- Upload authorization used to be stateless: the signature route counted only
-- finalized `profile_media` rows, so a client could request a signature and
-- upload bytes to Cloudinary without ever registering the asset. That allowed
-- unlimited abandoned uploads (storage and credit burn) and made orphaned assets
-- invisible. Every authorized upload now records an intent, which finalize
-- marks complete.

CREATE TABLE IF NOT EXISTS public.media_upload_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cloudinary_public_id TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('image', 'video')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF EXISTS media_upload_intents_public_id_idx
    ON public.media_upload_intents (cloudinary_public_id);

CREATE INDEX IF EXISTS media_upload_intents_listing_idx
    ON public.media_upload_intents (listing_id, requested_at DESC);

CREATE INDEX IF EXISTS media_upload_intents_open_idx
    ON public.media_upload_intents (completed_at)
    WHERE completed_at IS NULL;

ALTER TABLE public.media_upload_intents ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies: only the service-role key used by the API routes can
-- read or write this table. Providers see the outcome through `profile_media`.
