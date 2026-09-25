<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'account_kind'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable, HasRoles;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function escorts(): HasMany
    {
        return $this->hasMany(Escort::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'client_id');
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Escort::class, 'favorites', 'user_id', 'escort_id')->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['super_admin', 'moderator']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isClient(): bool
    {
        return $this->hasAnyRole(['client_free', 'client_premium']);
    }

    public function isPremiumClient(): bool
    {
        return $this->hasRole('client_premium') && $this->hasActivePlan(Subscription::PLAN_CLIENT_PREMIUM);
    }

    public function isModel(): bool
    {
        return $this->account_kind === 'model' && $this->isSpecialist();
    }

    public function isHomeSpecialist(): bool
    {
        return $this->account_kind === 'specialist' && $this->isSpecialist();
    }

    public function isSpecialist(): bool
    {
        return $this->hasAnyRole(['provider_free', 'provider_premium']);
    }

    public function hasActiveSpecialistSubscription(): bool
    {
        return $this->hasActivePlan(Subscription::PLAN_SPECIALIST);
    }

    public function hasActivePlan(string $plan): bool
    {
        return $this->subscriptions()
            ->where('plan', $plan)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->exists();
    }

    public function activatePlan(string $plan, string $period = 'monthly'): Subscription
    {
        $price = (int) Setting::get($plan.'_'.$period.'_price', 0);
        $customDays = (int) Setting::get($plan.'_custom_days', 30);
        $ends = match ($period) {
            'daily' => now()->addDay(),
            'yearly' => now()->addYear(),
            'custom' => now()->addDays(max($customDays, 1)),
            default => now()->addMonth(),
        };

        $subscription = $this->subscriptions()->updateOrCreate(
            ['plan' => $plan],
            [
                'status' => 'active',
                'period' => $period,
                'price_amount' => $price,
                'custom_days' => $period === 'custom' ? $customDays : null,
                'starts_at' => now(),
                'ends_at' => $ends,
            ],
        );

        if ($plan === Subscription::PLAN_SPECIALIST) {
            $this->syncRoles(['provider_premium']);
        }

        if ($plan === Subscription::PLAN_CLIENT_PREMIUM) {
            $this->syncRoles(['client_premium']);
        }

        return $subscription;
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $panel->getId() === 'admin' && $this->isAdmin();
    }
}
