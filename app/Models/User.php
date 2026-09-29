<?php

namespace App\Models;

use App\Support\PhoneNumber;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'phone', 'password', 'account_kind'])]
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

    protected function phone(): Attribute
    {
        return Attribute::set(fn (?string $value) => $value === null || $value === ''
            ? null
            : PhoneNumber::normalize($value));
    }

    public function escorts(): HasMany
    {
        return $this->hasMany(Escort::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
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

    /**
     * VIP access also covers the premium tier, so either client plan opens premium profiles.
     */
    public function canBrowsePremium(): bool
    {
        return $this->isAdmin()
            || $this->isPremiumClient()
            || $this->hasActivePlan(Subscription::PLAN_CLIENT_BASIC);
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

    public function hasActiveVipSubscription(): bool
    {
        return $this->hasActivePlan(Subscription::PLAN_ESCORT_VIP)
            || $this->hasActivePlan(Subscription::PLAN_SPECIALIST);
    }

    /**
     * Any paid listing plan. Every profile, premium included, needs one to be published.
     */
    public function hasActiveListingSubscription(): bool
    {
        return $this->subscriptions()
            ->whereIn('plan', Subscription::LISTING_PLANS)
            ->active()
            ->exists();
    }

    public function hasActivePlan(string $plan): bool
    {
        return $this->subscriptions()->where('plan', $plan)->active()->exists();
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

        if (in_array($plan, Subscription::LISTING_PLANS, true)) {
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
