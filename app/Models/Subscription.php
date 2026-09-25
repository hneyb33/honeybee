<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'plan', 'period', 'price_amount', 'custom_days', 'status', 'starts_at', 'ends_at'])]
class Subscription extends Model
{
    public const PLAN_SPECIALIST = 'specialist';

    public const PLAN_CLIENT_PREMIUM = 'client_premium';

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'price_amount' => 'integer',
            'custom_days' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

        if ($this->isCurrent()) {
            if ($this->plan === self::PLAN_SPECIALIST && $user->isSpecialist()) {
                $user->syncRoles(['provider_premium']);
            }

            if ($this->plan === self::PLAN_CLIENT_PREMIUM && ($user->account_kind === 'client' || $user->isClient())) {
                $user->syncRoles(['client_premium']);
            }

            return;
        }

        if ($this->plan === self::PLAN_SPECIALIST && $user->hasRole('provider_premium')) {
            $user->syncRoles(['provider_free']);
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
