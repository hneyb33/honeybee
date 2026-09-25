<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'title',
    'slug',
    'age',
    'gender',
    'ethnicity',
    'nationality',
    'height',
    'weight',
    'hair_color',
    'hair_length',
    'bust_size',
    'build',
    'looks',
    'smoker',
    'education',
    'sports',
    'zodiac_sign',
    'sexual_orientation',
    'occupation',
    'availability',
    'country',
    'phone',
    'summary_line',
    'description',
    'about_me',
    'services_offered',
    'languages',
    'rates',
    'extra_services',
    'tier',
    'kind',
    'escort_tier',
    'service_type',
    'category',
    'status',
    'verification_status',
    'verification_notes',
    'neighborhood',
    'city',
    'latitude',
    'longitude',
    'price_per_hour',
    'hourly_rate',
    'monthly_price',
    'rating',
    'review_count',
    'whatsapp_number',
    'telegram',
    'onboarding_step',
    'onboarding_data',
    'cover_image',
    'images',
    'is_featured',
])]
class Escort extends Model
{
    public const KIND_ESCORT = 'escort';

    public const KIND_SERVICE = 'service';

    public const TIER_VIP = 'vip';

    public const TIER_PREMIUM = 'premium';

    public const SERVICE_CHEF = 'private_chef';

    public const SERVICE_LAUNDRY = 'home_laundry';

    public const SERVICE_MASSAGE = 'private_massage';

    public const OFFERED_SERVICES = [
        'Party & travel companion',
        'Body to body Nuru massage',
        'DFK (deep french kissing)',
        'Western jazz (Kachabali)',
        'Striptease/lapdance',
        'Erotic massage',
        'Couples',
        'GFE (girlfriend experience)',
        'Threesome (duo)',
        'Sex toys',
        'Extraball (having sex multiple times)',
        'LT (long time, usually overnight)',
    ];

    public const BODY_TYPES = [
        'Slim',
        'Slender',
        'Busty',
        'Curvy',
        'Athletic',
        'Muscular',
        'Petite',
        'Round',
    ];

    public const AVAILABILITY_OPTIONS = [
        'Incall',
        'Outcall',
        'Video',
        'Sex chat',
    ];

    public const ORIENTATIONS = [
        'normal',
        'gay',
        'lesbian',
        'bi-sexual',
    ];

    public static function offeredServices(): array
    {
        $names = CatalogService::query()
            ->where('group', 'escort')
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return $names !== [] ? $names : self::OFFERED_SERVICES;
    }

    public static function homeServices(): array
    {
        return CatalogService::query()
            ->where('group', 'home')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->mapWithKeys(fn (CatalogService $service) => [$service->slug => $service->name])
            ->all() ?: [
                self::SERVICE_CHEF => 'Private chef',
                self::SERVICE_LAUNDRY => 'Home laundry',
                self::SERVICE_MASSAGE => 'Private massage',
            ];
    }

    public const VERIFIED = 'verified';

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'amenities' => 'array',
            'services_offered' => 'array',
            'languages' => 'array',
            'rates' => 'array',
            'extra_services' => 'boolean',
            'is_featured' => 'boolean',
            'monthly_price' => 'integer',
            'hourly_rate' => 'integer',
            'rating' => 'decimal:2',
            'review_count' => 'integer',
            'age' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'onboarding_step' => 'string',
            'onboarding_data' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProfileMedia::class)->orderBy('sort_order');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('verification_status', self::VERIFIED)
            ->whereHas('owner.subscriptions', function (Builder $subscription) {
                $subscription
                    ->where('plan', Subscription::PLAN_SPECIALIST)
                    ->where('status', 'active')
                    ->where(function (Builder $window) {
                        $window->whereNull('ends_at')->orWhere('ends_at', '>', now());
                    });
            });
    }

    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        $query = $query->published();

        if (! $user?->isPremiumClient() && ! $user?->isAdmin()) {
            $query->where(function (Builder $visible) {
                $visible->where('kind', self::KIND_SERVICE)
                    ->orWhere('escort_tier', '!=', self::TIER_VIP);
            });
        }

        return $query;
    }

    public function isVerified(): bool
    {
        return $this->verification_status === self::VERIFIED;
    }

    public function isVip(): bool
    {
        return $this->kind === self::KIND_ESCORT && $this->escort_tier === self::TIER_VIP;
    }

    public function tag(): string
    {
        if ($this->kind === self::KIND_SERVICE) {
            return 'Service';
        }

        return $this->escort_tier === self::TIER_VIP ? 'VIP' : 'Premium';
    }

    public function serviceLabel(): ?string
    {
        if ($this->kind !== self::KIND_SERVICE) {
            return null;
        }

        return self::homeServices()[$this->service_type] ?? null;
    }

    public function rateAmount(): int
    {
        return (int) ($this->hourly_rate ?: $this->monthly_price);
    }

    protected function priceLabel(): Attribute
    {
        return Attribute::get(fn (): string => 'UGX '.number_format($this->rateAmount()));
    }
}
