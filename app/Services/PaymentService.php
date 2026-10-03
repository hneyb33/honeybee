<?php

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Events\PaymentRejected;
use App\Events\PaymentSubmitted;
use App\Events\PaymentVerified;
use App\Events\SubscriptionActivated;
use App\Models\Payment;
use App\Models\PaymentAudit;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Payments\ManualMerchantGateway;
use App\Support\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /**
     * @return array<string, PaymentGateway>
     */
    public function availableProviders(): array
    {
        $providers = [];

        foreach (PaymentProvider::cases() as $provider) {
            $gateway = new ManualMerchantGateway($provider);

            if ($gateway->merchantCode() !== '') {
                $providers[$gateway->key()] = $gateway;
            }
        }

        return $providers;
    }

    public function paymentsEnabled(): bool
    {
        return $this->availableProviders() !== [];
    }

    public function gateway(PaymentProvider|string $provider): PaymentGateway
    {
        $key = $provider instanceof PaymentProvider ? $provider->value : $provider;
        $providers = $this->availableProviders();

        if (! isset($providers[$key])) {
            throw ValidationException::withMessages([
                'provider' => 'That payment network is not available.',
            ]);
        }

        return $providers[$key];
    }

    public function start(User $user, string $plan, string $period, string $provider): Payment
    {
        $gateway = $this->gateway($provider);
        $quote = $this->quote($plan, $period);

        $existing = Payment::query()
            ->where('user_id', $user->id)
            ->where('plan', $plan)
            ->where('period', $period)
            ->where('status', PaymentStatus::Pending)
            ->latest()
            ->first();

        if ($existing) {
            $existing->update([
                'provider' => $gateway->key(),
                'method' => $gateway->key(),
                'merchant_code' => $gateway->merchantCode(),
                'amount' => $quote['price'],
                'metadata' => $quote,
            ]);

            return $existing->fresh();
        }

        $payment = Payment::create([
            'user_id' => $user->id,
            'plan' => $plan,
            'period' => $period,
            'amount' => $quote['price'],
            'currency' => 'UGX',
            'method' => $gateway->key(),
            'provider' => $gateway->key(),
            'merchant_code' => $gateway->merchantCode(),
            'reference' => $this->reference(),
            'status' => PaymentStatus::Pending,
            'metadata' => $quote,
        ]);

        $this->audit($payment, 'created', null, PaymentStatus::Pending, 'Payment request created', request());

        return $payment;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function submit(Payment $payment, array $input, ?UploadedFile $proof, ?Request $request = null): Payment
    {
        $saved = DB::transaction(function () use ($payment, $input, $proof, $request) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($locked->status !== PaymentStatus::Pending) {
                throw ValidationException::withMessages([
                    'payment' => 'This payment can no longer be edited.',
                ]);
            }

            $phone = $this->normalizePhone((string) ($input['payer_phone'] ?? ''));

            if (! preg_match('/^256\d{9}$/', $phone)) {
                throw ValidationException::withMessages([
                    'payer_phone' => 'Enter a Uganda mobile number, for example 0772123456.',
                ]);
            }

            $provider = $locked->provider?->value;
            if (isset($input['provider']) && $input['provider'] !== $provider) {
                $gateway = $this->gateway((string) $input['provider']);
                $provider = $gateway->key();
                $locked->provider = $provider;
                $locked->method = $provider;
                $locked->merchant_code = $gateway->merchantCode();
            }

            $transactionId = trim((string) ($input['transaction_id'] ?? ''));
            $duplicate = Payment::query()
                ->where('provider', $provider)
                ->where('transaction_id', $transactionId)
                ->where('id', '!=', $locked->id)
                ->exists();

            if ($duplicate) {
                throw ValidationException::withMessages([
                    'transaction_id' => 'This transaction has already been used.',
                ]);
            }

            $proofPath = $locked->proof_path;
            if ($proof) {
                $proofPath = $proof->store('payment-proofs/'.$locked->id, 'local');
            }

            $locked->fill([
                'payer_phone' => $phone,
                'transaction_id' => $transactionId,
                'paid_at' => $input['paid_at'],
                'proof_path' => $proofPath,
                'status' => PaymentStatus::Submitted,
                'submitted_at' => now(),
            ]);

            try {
                $locked->save();
            } catch (UniqueConstraintViolationException) {
                throw ValidationException::withMessages([
                    'transaction_id' => 'This transaction has already been used.',
                ]);
            }

            $this->audit(
                $locked,
                'submitted',
                PaymentStatus::Pending,
                PaymentStatus::Submitted,
                'Client submitted transaction '.$transactionId,
                $request,
            );

            return $locked->fresh();
        });

        PaymentSubmitted::dispatch($saved);

        return $saved;
    }

    /**
     * The admin confirms the transaction in the merchant account, then presses Verify.
     *
     * @param  array<string, mixed>  $checks
     */
    public function verify(Payment $payment, User $admin, array $checks = []): ?Subscription
    {
        if ($payment->status === PaymentStatus::Verified) {
            return $payment->subscription;
        }

        $subscription = DB::transaction(function () use ($payment, $admin, $checks) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($locked->status === PaymentStatus::Verified) {
                return $locked->subscription?->fresh();
            }

            if ($locked->status !== PaymentStatus::Submitted) {
                throw ValidationException::withMessages([
                    'status' => 'Only a submitted payment can be verified.',
                ]);
            }

            $alreadyUsed = Payment::query()
                ->where('provider', $locked->provider)
                ->where('transaction_id', $locked->transaction_id)
                ->where('id', '!=', $locked->id)
                ->where('status', PaymentStatus::Verified)
                ->exists();

            if ($alreadyUsed) {
                throw ValidationException::withMessages([
                    'transaction_id' => 'This transaction has already been used.',
                ]);
            }

            $user = $locked->user()->lockForUpdate()->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'user_id' => 'This payment has no account to activate.',
                ]);
            }

            $period = in_array($locked->period, ['daily', 'monthly'], true) ? $locked->period : 'monthly';
            $subscription = $user->activatePlan($locked->plan, $period);
            $subscription->update([
                'status' => 'active',
                'price_amount' => $locked->amount,
                'payment_id' => $locked->id,
                'activated_by' => $admin->id,
                'activated_at' => now(),
            ]);

            $locked->update([
                'status' => PaymentStatus::Verified,
                'verified_at' => now(),
                'verified_by' => $admin->id,
                'subscription_id' => $subscription->id,
                'metadata' => array_merge(is_array($locked->metadata) ? $locked->metadata : [], [
                    'verification' => $checks,
                    'locked' => true,
                ]),
            ]);

            $this->audit(
                $locked,
                'verified',
                PaymentStatus::Submitted,
                PaymentStatus::Verified,
                'Transaction '.($locked->transaction_id ?: '—').' · UGX '.number_format($locked->amount),
                request(),
                $admin->id,
            );

            $this->audit(
                $locked,
                'subscription_activated',
                PaymentStatus::Verified,
                PaymentStatus::Verified,
                'Subscription #'.$subscription->id.' expires '.optional($subscription->ends_at)->format('j M Y'),
                request(),
                $admin->id,
            );

            return $subscription->fresh();
        });

        if (! $subscription) {
            return null;
        }

        $fresh = $payment->fresh(['subscription', 'user']);
        PaymentVerified::dispatch($fresh);
        SubscriptionActivated::dispatch($subscription);

        return $subscription;
    }

    public function reject(Payment $payment, User $admin, string $reason): Payment
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'rejection_reason' => 'A rejection reason is required.',
            ]);
        }

        $saved = DB::transaction(function () use ($payment, $admin, $reason) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($locked->status === PaymentStatus::Verified) {
                throw ValidationException::withMessages([
                    'payment' => 'A verified payment cannot be rejected.',
                ]);
            }

            if ($locked->status !== PaymentStatus::Submitted) {
                throw ValidationException::withMessages([
                    'payment' => 'Only a submitted payment can be rejected.',
                ]);
            }

            $locked->update([
                'status' => PaymentStatus::Rejected,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
                'verified_by' => $admin->id,
            ]);

            $this->audit(
                $locked,
                'rejected',
                PaymentStatus::Submitted,
                PaymentStatus::Rejected,
                $reason,
                request(),
                $admin->id,
            );

            return $locked->fresh();
        });

        PaymentRejected::dispatch($saved);

        return $saved;
    }

    public function normalizePhone(string $phone): string
    {
        return PhoneNumber::normalize($phone);
    }

    /**
     * @return array{plan_name: string, duration_label: string, duration_days: int, price: int}
     */
    public function quote(string $plan, string $period): array
    {
        $period = $period === 'daily' ? 'daily' : 'monthly';
        $days = $period === 'daily' ? 1 : 30;
        $label = $period === 'daily' ? '1 day' : '1 month';

        return [
            'plan_name' => Subscription::label($plan),
            'duration_label' => $label,
            'duration_days' => $days,
            'price' => (int) Setting::get($plan.'_'.$period.'_price', 0),
        ];
    }

    private function reference(): string
    {
        do {
            $reference = 'SUB-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (Payment::query()->where('reference', $reference)->exists());

        return $reference;
    }

    private function audit(
        Payment $payment,
        string $action,
        ?PaymentStatus $old,
        PaymentStatus $new,
        string $notes,
        ?Request $request = null,
        ?int $adminId = null,
    ): void {
        PaymentAudit::create([
            'payment_id' => $payment->id,
            'admin_id' => $adminId,
            'action' => $action,
            'old_status' => $old?->value,
            'new_status' => $new->value,
            'notes' => $notes,
            'ip_address' => $request?->ip(),
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 500) : null,
        ]);
    }
}
