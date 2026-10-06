<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'plan', 'period', 'price_amount', 'custom_days', 'status', 'starts_at', 'ends_at', 'payment_id', 'activated_by', 'activated_at'])]
class Subscription extends Model
{
    public const PLAN_SPECIALIST = 'specialist';

    public const PLAN_CLIENT_BASIC = 'client_basic';

    public const PLAN_CLIENT_PREMIUM = 'client_premium';

    public const PLAN_ESCORT_PREMIUM = 'escort_premium';

    public const PLAN_ESCORT_VIP = 'escort_vip';

    /** Plans that put a profile in the public listings. */
    public const LISTING_PLANS = [self::PLAN_SPECIALIST, self::PLAN_ESCORT_PREMIUM, self::PLAN_ESCORT_VIP];

    /**
     * Every plan the account type is allowed to buy, cheapest first.
     *
     * @return array<int, string>
     */
    public static function plansFor(User $user): array
    {
        if ($user->isClient()) {
            return [self::PLAN_CLIENT_PREMIUM];
        }

        if ($user->isModel()) {
            return [self::PLAN_ESCORT_PREMIUM, self::PLAN_ESCORT_VIP];
        }

        if ($user->isSpecialist()) {
            return [self::PLAN_SPECIALIST];
        }

        return [];
    }

    public static function planFor(User $user): ?string
    {
        return self::plansFor($user)[0] ?? null;
    }

    public static function label(string $plan): string
    {
        return match ($plan) {
            self::PLAN_CLIENT_BASIC => 'Premium access',
            self::PLAN_CLIENT_PREMIUM => 'VIP access',
            self::PLAN_ESCORT_PREMIUM => 'Premium listing',
            self::PLAN_ESCORT_VIP => 'VIP listing',
            default => 'Specialist listing',
        };
    }

    public static function description(string $plan): string
    {
        return match ($plan) {
            self::PLAN_CLIENT_BASIC => 'Open and browse premium escort profiles.',
            self::PLAN_CLIENT_PREMIUM => 'Open VIP escort profiles. Premium escorts and service providers are open without a subscription.',
            self::PLAN_ESCORT_PREMIUM => 'List your profile in the premium tier.',
            self::PLAN_ESCORT_VIP => 'List your profile in the VIP tier, above premium.',
            default => 'List your home service profile.',
        };
    }

    public static function activationMessage(string $plan): string
    {
        return match ($plan) {
            self::PLAN_CLIENT_BASIC => 'Premium access is active.',
            self::PLAN_CLIENT_PREMIUM => 'VIP access is active.',
            self::PLAN_ESCORT_PREMIUM => 'Premium subscription is active. Submit your profile for verification to be listed.',
            self::PLAN_ESCORT_VIP => 'VIP subscription is active. Submit your profile for verification to be listed.',
            default => 'Specialist subscription is active. Submit your profile for verification to be listed.',
        };
    }

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'activated_at' => 'datetime',
            'price_amount' => 'integer',
            'custom_days' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('status', SubscriptionStatus::Active->value)
            ->where(function (Builder $query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function (Builder $query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
            });
    }

    protected static function booted(): void
    {
        static::saved(function (Subscription $subscription): void {
            $subscription->syncAccountRole();
        });
    }

    public function syncAccountRole(): void
    {
        $user = $this->user;

        if (! $user || $user->isAdmin()) {
            return;
        }

        $providerPlans = self::LISTING_PLANS;

        if (in_array($this->plan, $providerPlans, true) && $user->isSpecialist()) {
            $stillListed = $user->subscriptions()->whereIn('plan', $providerPlans)->active()->exists();

            if ($this->isCurrent() || $stillListed) {
                $user->syncRoles(['provider_premium']);
            } elseif ($user->hasRole('provider_premium')) {
                $user->syncRoles(['provider_free']);
            }

            return;
        }

        if ($this->isCurrent()) {
            if ($this->plan === self::PLAN_CLIENT_PREMIUM && ($user->account_kind === 'client' || $user->isClient())) {
                $user->syncRoles(['client_premium']);
            }

            return;
        }

        if ($this->plan === self::PLAN_CLIENT_PREMIUM && $user->hasRole('client_premium')) {
            $user->syncRoles(['client_free']);
        }
    }

    public function isCurrent(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->ends_at && $this->ends_at->isPast()) {
            return false;
        }

        return true;
    }
}
