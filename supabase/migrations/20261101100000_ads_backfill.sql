-- Backfill: seed `ads` from the provider `listings` that are already being used
-- as advertising placements (featured, or created through the old advertiser
-- flow). This keeps existing featured slots live during the cutover from the
-- conflated `listings` model to the dedicated `ads` table.
--
-- Non-featured profiles are intentionally NOT seeded: they stay directory-only.
-- An ad spun from a profile keeps a `source_listing_id` link so the profile and
-- its paid placement can still be traced to one another.

-- 1. Ads -------------------------------------------------------------------
INSERT INTO public.ads (
    user_id,
    source_listing_id,
    ad_type,
    title,
    slug,
    category,
    summary_line,
    description,
    city,
    neighborhood,
    country,
    contact_whatsapp_code,
    contact_whatsapp_number,
    contact_telegram,
    links,
    cover_image,
    starts_at,
    ends_at,
    is_featured,
    featured_tier,
    status,
    amount,
    currency,
    payment_status,
    created_at,
    updated_at
)
SELECT
    l.user_id,
    l.id,
    COALESCE(l.advertiser_type, 'independent'),
    l.title,
    l.slug,
    CASE
        WHEN l.advertiser_type = 'agency' THEN 'business'
        WHEN l.kind = 'service' THEN 'service'
        ELSE 'companion'
    END,
    l.summary_line,
    l.description,
    l.city,
    l.neighborhood,
    'Uganda',
    l.whatsapp_code,
    l.whatsapp_number,
    l.telegram,
    '[]'::jsonb,
    l.cover_image,
    l.created_at,
    l.featured_until,
    l.is_featured,
    CASE WHEN l.is_featured THEN l.featured_tier ELSE NULL END,
    'published',
    0,
    COALESCE(l.currency, 'UGX'),
    'unpaid',
    l.created_at,
    l.updated_at
FROM public.listings l
WHERE l.verification_status = 'verified'
    AND (l.is_featured = true OR l.advertiser_type IS NOT NULL)
ON CONFLICT (slug) DO NOTHING;

-- 2. Ad media --------------------------------------------------------------
-- Copy the Cloudinary delivery columns from the source profile's portfolio so a
-- seeded ad renders the same images/video it did when it lived in `listings`.
-- Keyed on source_listing_id so we only copy for ads we actually just created.
INSERT INTO public.ad_media (
    ad_id,
    url,
    kind,
    sort_order,
    thumbnail_url,
    storage_provider,
    cloudinary_public_id,
    cloudinary_asset_id,
    original_filename,
    original_url,
    mime_type,
    bytes,
    width,
    height,
    duration_seconds,
    card_url,
    detail_url,
    playback_url,
    processing_status,
    created_at
)
SELECT
    a.id,
    pm.url,
    pm.kind,
    pm.sort_order,
    pm.thumbnail_url,
    pm.storage_provider,
    pm.cloudinary_public_id,
    pm.cloudinary_asset_id,
    pm.original_filename,
    pm.original_url,
    pm.mime_type,
    pm.bytes,
    pm.width,
    pm.height,
    pm.duration_seconds,
    pm.card_url,
    pm.detail_url,
    pm.playback_url,
    pm.processing_status,
    pm.created_at
FROM public.profile_media pm
JOIN public.ads a ON a.source_listing_id = pm.listing_id
WHERE pm.cloudinary_public_id IS NULL
    OR NOT EXISTS (
        SELECT 1 FROM public.ad_media am
        WHERE am.cloudinary_public_id = pm.cloudinary_public_id
    )
ON CONFLICT DO NOTHING;
