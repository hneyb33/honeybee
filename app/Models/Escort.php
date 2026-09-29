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
    'whatsapp_code',
    'telegram',
    'telegram_code',
    'onboarding_step',
    'onboarding_data',
    'experience_band',
    'learning_methods',
    'has_certificate',
    'certificate_type',
    'certificate_path',
    'weekly_hours',
    'travel_km',
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
        'straight',
        'lesbian',
        'gay',
        'bi-sexual',
    ];

    /**
     * @return array<int, string>
     */
    public static function orientationMatches(string $category): array
    {
        $category = strtolower($category);

        if (in_array($category, ['bi-sexual', 'bisexual'], true)) {
            return ['bi-sexual', 'bisexual', 'Bisexual', 'Bi-sexual'];
        }

        return [$category, ucfirst($category)];
    }

    public const LANGUAGES = [
        'English',
        'Swahili',
        'Luganda',
        'Lusoga',
        'Runyankore-Rukiga',
        'Rutooro',
        'Ateso',
        'Acholi/Lango',
        'Lugbara',
    ];

    public const NATIONALITIES = [
        'Uganda',
        'Kenya',
        'Tanzania',
        'Rwanda',
        'Burundi',
        'South Sudan',
        'Ethiopia',
        'Somalia',
        'Djibouti',
        'Eritrea',
        'Zambia',
        'Zimbabwe',
        'Malawi',
        'Mozambique',
        'Madagascar',
        'Comoros',
        'Mauritius',
        'Seychelles',
        'South Africa',
        'Nigeria',
        'Ghana',
    ];

    public const DIAL_CODES = [
        '+256' => 'Uganda +256',
        '+254' => 'Kenya +254',
        '+255' => 'Tanzania +255',
        '+250' => 'Rwanda +250',
        '+257' => 'Burundi +257',
        '+211' => 'South Sudan +211',
        '+251' => 'Ethiopia +251',
        '+252' => 'Somalia +252',
        '+253' => 'Djibouti +253',
        '+291' => 'Eritrea +291',
        '+260' => 'Zambia +260',
        '+263' => 'Zimbabwe +263',
        '+265' => 'Malawi +265',
        '+258' => 'Mozambique +258',
        '+261' => 'Madagascar +261',
        '+269' => 'Comoros +269',
        '+230' => 'Mauritius +230',
        '+248' => 'Seychelles +248',
        '+27' => 'South Africa +27',
        '+234' => 'Nigeria +234',
        '+233' => 'Ghana +233',
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
            'learning_methods' => 'array',
            'has_certificate' => 'boolean',
            'weekly_hours' => 'array',
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

    public function offerings(): HasMany
    {
        return $this->hasMany(EscortOffering::class)->orderBy('sort_order');
    }

    public function references(): HasMany
    {
        return $this->hasMany(EscortReference::class);
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
            ->where(function (Builder $listed) {
                $listed->where(function (Builder $freePremium) {
                    $freePremium->where('kind', self::KIND_ESCORT)
                        ->where('escort_tier', self::TIER_PREMIUM);
                })->orWhere(function (Builder $paid) {
                    $paid->where(function (Builder $requiresPlan) {
                        $requiresPlan->where('kind', '!=', self::KIND_ESCORT)
                            ->orWhere('escort_tier', '!=', self::TIER_PREMIUM);
                    })->whereHas('owner.subscriptions', function (Builder $subscription) {
                        $subscription
                            ->active()
                            ->whereIn('plan', [Subscription::PLAN_SPECIALIST, Subscription::PLAN_ESCORT_VIP]);
                    });
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

        if ($this->service_type === 'other') {
            return $this->occupation ?: 'Home service';
        }

        return \App\Support\HomeServiceCatalog::OCCUPATIONS[$this->service_type]
            ?? self::homeServices()[$this->service_type]
            ?? $this->occupation;
    }

    public function experienceLabel(): ?string
    {
        return \App\Support\HomeServiceCatalog::EXPERIENCE[$this->experience_band] ?? null;
    }

    /**
     * @return array<int, string>
     */
    public function learningLabels(): array
    {
        return collect($this->learning_methods ?? [])
            ->map(fn (string $key): string => \App\Support\HomeServiceCatalog::LEARNING[$key] ?? $key)
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, on: bool, from: string, to: string}>
     */
    public function availabilityLines(): array
    {
        $hours = $this->weekly_hours ?? [];
        $lines = [];

        foreach (\App\Support\HomeServiceCatalog::DAYS as $key => $label) {
            $day = $hours[$key] ?? [];
            $lines[] = [
                'label' => $label,
                'on' => filter_var($day['on'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'from' => (string) ($day['from'] ?? ''),
                'to' => (string) ($day['to'] ?? ''),
            ];
        }

        return $lines;
    }

    public function rateAmount(): int
    {
        return (int) ($this->hourly_rate ?: $this->monthly_price);
    }

    /**
     * @return array<int, string>
     */
    public function spokenLanguages(): array
    {
        $languages = $this->languages ?? [];

        if ($languages === []) {
            return [];
        }

        if (array_is_list($languages)) {
            return array_values(array_filter($languages));
        }

        return array_keys($languages);
    }

    public function whatsappLabel(): string
    {
        $digits = $this->internationalDigits($this->whatsapp_code, $this->whatsapp_number);

        return $digits ? '+'.$digits : '';
    }

    public function telegramLabel(): string
    {
        $raw = trim((string) $this->telegram);

        if ($raw !== '' && preg_match('/[A-Za-z]/', $raw)) {
            return '@'.ltrim($raw, '@');
        }

        $digits = $this->internationalDigits($this->telegram_code, $raw);

        return $digits ? '+'.$digits : '';
    }

    public function whatsappUrl(): ?string
    {
        $digits = $this->internationalDigits($this->whatsapp_code, $this->whatsapp_number);

        return $digits !== null ? 'https://wa.me/'.$digits : null;
    }

    public function telegramUrl(): ?string
    {
        $raw = trim((string) $this->telegram);

        if ($raw === '') {
            return null;
        }

        if (preg_match('/[A-Za-z]/', $raw)) {
            return 'https://t.me/'.ltrim($raw, '@');
        }

        $digits = $this->internationalDigits($this->telegram_code, $raw);

        return $digits !== null ? 'https://t.me/+'.$digits : null;
    }

    private function internationalDigits(?string $code, ?string $number): ?string
    {
        $local = preg_replace('/\D/', '', (string) $number) ?? '';
        $local = ltrim($local, '0');

        if ($local === '') {
            return null;
        }

        $codeDigits = preg_replace('/\D/', '', $code ?: '+256') ?: '256';

        if (str_starts_with($local, $codeDigits)) {
            return $local;
        }

        return $codeDigits.$local;
    }

    public function profileVideo(): ?ProfileMedia
    {
        return $this->media->firstWhere('kind', 'video')
            ?? $this->media()->where('kind', 'video')->first();
    }

    protected function priceLabel(): Attribute
    {
        return Attribute::get(fn (): string => 'UGX '.number_format($this->rateAmount()));
    }
}
