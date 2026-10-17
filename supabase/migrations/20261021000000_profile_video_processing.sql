ALTER TABLE public.profile_media
    ADD COLUMN original_url TEXT,
    ADD COLUMN source_path TEXT,
    ADD COLUMN processed_path TEXT,
    ADD COLUMN thumbnail_url TEXT,
    ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'ready'
        CHECK (processing_status IN ('pending', 'processing', 'ready')),
    ADD COLUMN processing_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN processing_started_at TIMESTAMPTZ,
    ADD COLUMN processing_error TEXT;

UPDATE storage.buckets
SET file_size_limit = 262144000
WHERE id = 'honeybee-profile-media';

UPDATE public.profile_media
SET original_url = url,
    source_path = substring(
        url FROM '/storage/v1/object/public/honeybee-profile-media/(.*)$'
    ),
    processing_status = CASE
        WHEN url ~ '/storage/v1/object/public/honeybee-profile-media/' THEN 'pending'
        ELSE 'ready'
    END
WHERE kind = 'video';

CREATE INDEX profile_media_video_jobs_idx
    ON public.profile_media (next_attempt_at, created_at)
    WHERE kind = 'video' AND processing_status IN ('pending', 'processing');

CREATE OR REPLACE FUNCTION public.claim_profile_video_job()
RETURNS TABLE (media_id UUID, source_path TEXT, attempt_count INTEGER)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH candidate AS (
        SELECT id
        FROM public.profile_media
        WHERE kind = 'video'
          AND source_path IS NOT NULL
          AND (
              (processing_status = 'pending' AND next_attempt_at <= now())
              OR (
                  processing_status = 'processing'
                  AND processing_started_at < now() - interval '30 minutes'
              )
          )
        ORDER BY next_attempt_at, created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.profile_media AS media
    SET processing_status = 'processing',
        processing_started_at = now(),
        processing_attempts = media.processing_attempts + 1
    FROM candidate
    WHERE media.id = candidate.id
    RETURNING media.id, media.source_path, media.processing_attempts;
$$;

REVOKE ALL ON FUNCTION public.claim_profile_video_job() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_profile_video_job() TO service_role;
