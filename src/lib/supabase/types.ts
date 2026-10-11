export type AccountKind = 'client' | 'specialist' | 'model' | 'agency' | 'admin';
export type AdvertiserType = 'fast' | 'independent' | 'agency';
export type UserRole = 'client_free' | 'client_premium' | 'provider_free' | 'provider_premium' | 'moderator' | 'super_admin';
export type ListingKind = 'escort' | 'service';
export type EscortTier = 'standard' | 'premium' | 'vip';
export type VerificationStatus = 'draft' | 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'travelling' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  phone_country?: string;
  advertiser_type?: AdvertiserType;
  account_kind: AccountKind;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileOffering {
  id: string;
  listing_id: string;
  group_name: string;
  name: string;
  price: number;
  pricing_model?: string;
  turnaround?: string;
  location_type?: string;
  sort_order?: number;
}

export interface ProfileReference {
  id: string;
  listing_id: string;
  referee_name: string;
  relationship: string;
  phone: string;
  organization?: string;
  years_known: number;
  status: 'pending' | 'contacted' | 'confirmed';
}

export interface Listing {
  id: string;
  user_id?: string;
  title: string;
  slug: string;
  kind: ListingKind;
  escort_tier: EscortTier;
  service_type?: string;
  category: string; // female, male, bi-sexual, trans, service
  age?: number;
  gender?: string;
  ethnicity?: string;
  nationality?: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  hourly_rate: number;
  monthly_price?: number;
  currency: string;
  summary_line?: string;
  description: string;
  about_me?: string;
  services_offered: string[];
  languages: string[];
  rates?: Record<string, string>;
  availability?: Array<{ label: string; on: boolean; from?: string; to?: string }>;
  verification_status: VerificationStatus;
  verification_notes?: string;
  rating: number;
  review_count: number;
  whatsapp_number?: string;
  whatsapp_code?: string;
  telegram?: string;
  telegram_code?: string;
  cover_image: string;
  images: string[];
  tag?: string;
  is_featured: boolean;
  featured_tier?: "premium" | "vip" | null;
  featured_until?: string | null;
  last_seen_at?: string | null;
  advertiser_type?: AdvertiserType;
  experience_band?: string;
  has_certificate?: boolean;
  certificate_url?: string;
  travel_km?: string;
  profile_details?: {
    yearsExperience?: string;
    certified?: boolean;
    orientation?: string;
    [key: string]: unknown;
  };
  offerings?: ProfileOffering[];
  references?: ProfileReference[];
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  listing_id: string;
  listing?: Listing;
  client?: Profile;
  starts_at: string;
  duration_hours: number;
  experience_type?: string;
  note?: string;
  channel: 'web' | 'whatsapp' | 'telegram';
  status: BookingStatus;
  price_amount: number;
  currency: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id?: string;
  client_id: string;
  client_name?: string;
  listing_id: string;
  rating: number;
  body?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  period: 'daily' | 'monthly';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  starts_at: string;
  ends_at?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  plan: string;
  period: string;
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'flutterwave' | 'pesapal';
  amount: number;
  currency: string;
  merchant_code?: string;
  payer_phone?: string;
  transaction_id?: string;
  proof_url?: string;
  status: PaymentStatus;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}
