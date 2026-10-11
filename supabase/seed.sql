-- Honeybee Seed Data
-- 1. Places (Kampala Suburbs & Key Towns)
INSERT INTO public.places (name, area, city, latitude, longitude) VALUES
('Kololo', 'Kololo', 'Kampala', 0.332000, 32.594000),
('Nakasero', 'Nakasero', 'Kampala', 0.323000, 32.578000),
('Bugolobi', 'Bugolobi', 'Kampala', 0.313000, 32.610000),
('Naguru', 'Naguru', 'Kampala', 0.338000, 32.612000),
('Ntinda', 'Ntinda', 'Kampala', 0.353000, 32.615000),
('Bukoto', 'Bukoto', 'Kampala', 0.348000, 32.590000),
('Najjera', 'Najjera', 'Kampala', 0.378000, 32.630000),
('Kisaasi', 'Kisaasi', 'Kampala', 0.370000, 32.600000),
('Kyaliwajjala', 'Kyaliwajjala', 'Kampala', 0.385000, 32.640000),
('Munyonyo', 'Munyonyo', 'Kampala', 0.240000, 32.625000),
('Muyenga', 'Muyenga', 'Kampala', 0.295000, 32.610000),
('Entebbe', 'Entebbe Town', 'Entebbe', 0.064000, 32.443000)
ON CONFLICT DO NOTHING;

-- 2. Mock provider profiles
INSERT INTO public.profiles (id, email, name, phone, account_kind, role) VALUES
('00000000-0000-0000-0000-000000000002', 'dohna@honeybee.ug', 'Dohna K.', '+256766591964', 'model', 'provider_premium'),
('00000000-0000-0000-0000-000000000003', 'chef.sam@honeybee.ug', 'Chef Samuel Kato', '+256701234567', 'specialist', 'provider_premium'),
('00000000-0000-0000-0000-000000000004', 'massage.sara@honeybee.ug', 'Sarah Nabatanzi', '+256709876543', 'specialist', 'provider_premium')
ON CONFLICT DO NOTHING;

-- 3. Listings
INSERT INTO public.listings (
    id, user_id, title, slug, kind, escort_tier, service_type, category, age, gender,
    nationality, city, neighborhood, latitude, longitude, hourly_rate, currency,
    summary_line, description, about_me, services_offered, languages, verification_status,
    rating, review_count, whatsapp_number, telegram, cover_image, images, is_featured
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Dohna',
    'dohna-kyaliwajjala',
    'escort',
    'vip',
    NULL,
    'female',
    25,
    'female',
    'Ugandan',
    'Kampala',
    'Kyaliwajjala',
    0.385000,
    32.640000,
    150000,
    'UGX',
    '25-year-old VIP companion in Kyaliwajjala, Kampala',
    'I take pride in creating a relaxed, friendly, and discreet atmosphere where you can truly unwind and feel comfortable. Whether you are looking for pleasant companionship, refined conversation over dinner, or a soothing break away from your busy schedule, every meeting is treated with utmost discretion and respect.',
    '25-year-old welcoming host based in Kyaliwajjala, Kampala. Passionate about music, yoga, and pleasant company.',
    '["Dinner date companion", "Travel & event partner", "Relaxing Swedish massage", "Private party hosting"]'::jsonb,
    '["English", "Luganda"]'::jsonb,
    'verified',
    4.9,
    14,
    '256766591964',
    'dohna_hb',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Chef Samuel',
    'chef-samuel-kololo',
    'service',
    'premium',
    'private_chef',
    'service',
    32,
    'male',
    'Ugandan',
    'Kampala',
    'Kololo',
    0.332000,
    32.594000,
    80000,
    'UGX',
    'Executive Private Chef & Boutique Catering in Kololo',
    'Certified culinary professional with 8 years of luxury hotel and private estate dining experience. Specialising in continental dining, authentic local Ugandan fusion, intimate birthday dinners, and meal prep service.',
    'Passionate chef dedicated to unforgettable dining experiences right in your home. Fully equipped with professional cutlery, hygiene certification, and menu planning.',
    '["Intimate 3-course dinner", "Weekend family barbecue", "Weekly healthy meal prep", "Boutique cocktail party catering"]'::jsonb,
    '["English", "Swahili", "Luganda"]'::jsonb,
    'verified',
    4.95,
    28,
    '256701234567',
    'chefsamuel_ug',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80',
    '["https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'Sarah N. Wellness',
    'sarah-wellness-ntinda',
    'service',
    'premium',
    'private_massage',
    'service',
    28,
    'female',
    'Ugandan',
    'Kampala',
    'Ntinda',
    0.353000,
    32.615000,
    70000,
    'UGX',
    'Certified Deep Tissue & Mobile Aromatherapy Therapist',
    'Experienced wellness therapist providing therapeutic body treatments, stress relief, and post-workout recovery in the comfort of your residence or hotel. Certified organic essential oils and portable heated massage bed provided.',
    'Dedicated to rejuvenating your physical body and relieving chronic tension. 6 years experience in 5-star wellness spas in Kampala.',
    '["Deep tissue therapy", "Aromatherapy relaxation", "Reflexology foot massage", "Couples home wellness session"]'::jsonb,
    '["English", "Luganda"]'::jsonb,
    'verified',
    4.88,
    19,
    '256709876543',
    'sarahwellness',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
    '["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- 4. Offerings
INSERT INTO public.profile_offerings (listing_id, group_name, name, price, pricing_model, turnaround, location_type) VALUES
('10000000-0000-0000-0000-000000000002', 'Private Dining', '3-Course Intimate Dinner (2 people)', 180000, 'Fixed price', '3 hours prep', 'Client premises'),
('10000000-0000-0000-0000-000000000002', 'Private Dining', 'Family Weekend Barbecue Feast', 350000, 'Fixed price', 'Same-day', 'Client premises'),
('10000000-0000-0000-0000-000000000003', 'Wellness Treatments', 'Full Body Deep Tissue (90 min)', 120000, 'Fixed price', 'Instant', 'Outcall / Hotel'),
('10000000-0000-0000-0000-000000000003', 'Wellness Treatments', 'Aromatherapy Stress Relief (60 min)', 85000, 'Fixed price', 'Instant', 'Outcall / Hotel')
ON CONFLICT DO NOTHING;
