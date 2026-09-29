<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'subscription_id',
    'plan',
    'period',
    'amount',
    'currency',
    'method',
    'provider',
    'merchant_code',
    'payer_phone',
    'status',
    'reference',
    'transaction_id',
    'proof_path',
    'paid_at',
    'submitted_at',
    'verified_at',
    'verified_by',
    'rejected_at',
    'rejection_reason',
    'metadata',
])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'provider' => PaymentProvider::class,
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
            'rejected_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function audits(): HasMany
    {
        return $this->hasMany(PaymentAudit::class)->latest('id');
    }

    public function planLabel(): string
    {
        return $this->metadata['plan_name'] ?? match ($this->plan) {
            Subscription::PLAN_CLIENT_PREMIUM => 'Premium',
            Subscription::PLAN_SPECIALIST => 'Specialist',
            default => 'Subscription',
        };
    }

    public function durationLabel(): string
    {
        return $this->metadata['duration_label'] ?? match ($this->period) {
            'daily' => '1 day',
            'yearly' => '1 year',
            'custom' => (($this->metadata['duration_days'] ?? 1).' days'),
            default => '1 month',
        };
    }

    public static function displayPhone(?string $phone): string
    {
        if ($phone && str_starts_with($phone, '256') && strlen($phone) === 12) {
            return '0'.substr($phone, 3);
        }

        return $phone ?: '—';
    }

    public function verifiedSummary(): string
    {
        $start = $this->subscription?->starts_at?->format('j M Y');
        $end = $this->subscription?->ends_at?->format('j M Y');

        return 'Your UGX '.number_format($this->amount).' payment via '.$this->provider?->label().' has been verified. '
            .$this->planLabel().' plan. Activated: '.($start ?: 'today').'. Expires: '.($end ?: '—').'. Your subscription is now active.';
    }

    public function rejectedSummary(): string
    {
        return 'We could not verify transaction '.($this->transaction_id ?: 'this payment').'. '
            .($this->rejection_reason ?: 'Check the transaction details or contact support.');
    }
}
