<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymentService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SubscriptionPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_plans_activate_immediately_while_merchant_codes_are_empty(): void
    {
        config([
            'payments.mtn.merchant_code' => null,
            'payments.airtel.merchant_code' => null,
        ]);

        $client = $this->client();

        $this->actingAs($client)
            ->post(route('client.subscribe'), ['period' => 'monthly'])
            ->assertRedirect()
            ->assertSessionHas('status', 'Premium access is active.');

        $this->assertTrue($client->fresh()->canBrowsePremium());
        $this->assertFalse($client->fresh()->isPremiumClient());
        $this->assertSame(0, Payment::query()->count());

        $specialist = User::factory()->create(['account_kind' => 'model']);
        $specialist->assignRole('provider_free');

        $this->actingAs($specialist)
            ->post(route('owner.subscribe'), ['plan' => Subscription::PLAN_ESCORT_VIP, 'period' => 'monthly'])
            ->assertSessionHas('status', 'VIP subscription is active. Submit your profile for verification to be listed.');

        $this->assertTrue($specialist->fresh()->hasRole('provider_premium'));
    }

    public function test_a_merchant_code_creates_a_pending_payment_without_activating_access(): void
    {
        Setting::put('client_premium_monthly_price', '50000');
        config(['payments.mtn.merchant_code' => '123456']);

        $client = $this->client();

        $this->actingAs($client)
            ->post(route('client.subscribe'), [
                'plan' => Subscription::PLAN_CLIENT_PREMIUM,
                'period' => 'monthly',
                'provider' => 'mtn_momo',
            ])
            ->assertRedirect();

        $payment = Payment::query()->firstOrFail();

        $this->assertSame(PaymentStatus::Pending, $payment->status);
        $this->assertSame(50000, $payment->amount);
        $this->assertSame('123456', $payment->merchant_code);
        $this->assertMatchesRegularExpression('/^SUB-\d{8}-[A-Z0-9]{6}$/', $payment->reference);
        $this->assertFalse($client->fresh()->hasRole('client_premium'));

        $this->actingAs($client)
            ->get(route('payments.show', $payment))
            ->assertOk()
            ->assertSee($payment->reference)
            ->assertSee('UGX 50,000')
            ->assertSee('123456')
            ->assertSee('*165*3#')
            ->assertSee('Submit payment for verification')
            ->assertDontSee('name="amount"', false);
    }

    public function test_airtel_instructions_do_not_invent_a_ussd_code(): void
    {
        config(['payments.airtel.merchant_code' => '654321']);

        $client = $this->client();
        $payment = app(PaymentService::class)->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'airtel_money');

        $this->actingAs($client)
            ->get(route('payments.show', $payment))
            ->assertOk()
            ->assertSee('Follow the Airtel Money Pay prompts')
            ->assertDontSee('*165*3#')
            ->assertDontSee('*185');
    }

    public function test_submitting_proof_does_not_activate_the_subscription(): void
    {
        Storage::fake('local');
        Setting::put('client_premium_monthly_price', '50000');
        config(['payments.mtn.merchant_code' => '123456']);

        $client = $this->client();
        $payment = app(PaymentService::class)->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'mtn_momo');

        $this->actingAs($client)
            ->post(route('payments.submit', $payment), [
                'provider' => 'mtn_momo',
                'payer_phone' => '0772123456',
                'transaction_id' => '18472930484',
                'paid_at' => now()->subMinutes(10)->format('Y-m-d H:i:s'),
                'amount' => 1,
                'proof' => UploadedFile::fake()->image('sms.jpg'),
            ])
            ->assertRedirect(route('payments.show', $payment));

        $payment->refresh();

        $this->assertSame(PaymentStatus::Submitted, $payment->status);
        $this->assertSame('256772123456', $payment->payer_phone);
        $this->assertSame(50000, $payment->amount);
        $this->assertNotNull($payment->proof_path);
        Storage::disk('local')->assertExists($payment->proof_path);
        $this->assertFalse($client->fresh()->hasActivePlan(Subscription::PLAN_CLIENT_PREMIUM));
        $this->assertDatabaseHas('payment_audits', [
            'payment_id' => $payment->id,
            'action' => 'submitted',
        ]);

        $this->actingAs($client)
            ->get(route('payments.proof', $payment))
            ->assertForbidden();
    }

    public function test_a_transaction_id_cannot_be_reused(): void
    {
        config(['payments.mtn.merchant_code' => '123456']);
        $service = app(PaymentService::class);
        $first = $this->client();
        $second = User::factory()->create(['account_kind' => 'client', 'email' => 'second@example.com']);
        $second->assignRole('client_free');

        $firstPayment = $service->start($first, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'mtn_momo');
        $secondPayment = $service->start($second, Subscription::PLAN_CLIENT_PREMIUM, 'daily', 'mtn_momo');

        $payload = [
            'payer_phone' => '0772000111',
            'transaction_id' => 'MP2399',
            'paid_at' => now()->subHour()->format('Y-m-d H:i:s'),
        ];

        $this->actingAs($first)->post(route('payments.submit', $firstPayment), $payload)->assertRedirect();

        $this->actingAs($second)
            ->from(route('payments.show', $secondPayment))
            ->post(route('payments.submit', $secondPayment), $payload)
            ->assertSessionHasErrors('transaction_id');

        $this->assertSame(PaymentStatus::Pending, $secondPayment->fresh()->status);
    }

    public function test_admin_verification_activates_the_subscription_once(): void
    {
        config(['payments.mtn.merchant_code' => '123456']);
        $client = $this->client();
        $admin = User::factory()->create(['email' => 'payments-admin@example.com']);
        $admin->assignRole('super_admin');
        $service = app(PaymentService::class);

        $payment = $service->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'mtn_momo');
        $service->submit($payment, [
            'payer_phone' => '+256772123456',
            'transaction_id' => '18472930484',
            'paid_at' => now()->subMinutes(5)->toDateTimeString(),
        ], null);

        $subscription = $service->verify($payment->fresh(), $admin, $this->checks());

        $this->assertSame(PaymentStatus::Verified, $payment->fresh()->status);
        $this->assertTrue($subscription->isCurrent());
        $this->assertSame($payment->id, $subscription->payment_id);
        $this->assertTrue($client->fresh()->hasRole('client_premium'));
        $this->assertTrue($client->fresh()->hasActivePlan(Subscription::PLAN_CLIENT_PREMIUM));
        $this->assertTrue($payment->fresh()->metadata['locked'] ?? false);

        $this->actingAs($client)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertSee('VIP access is active');

        $again = $service->verify($payment->fresh(), $admin, $this->checks());
        $this->assertSame($subscription->id, $again->id);
        $this->assertSame(PaymentStatus::Verified, $payment->fresh()->status);
        $this->assertNull($service->verify($payment->fresh(), $admin, [
            'transaction_exists' => true,
            'transaction_matches' => true,
            'amount_matches' => false,
            'payment_received' => true,
            'not_reused' => true,
        ]));
    }

    public function test_rejection_requires_a_reason_and_does_not_activate_access(): void
    {
        config(['payments.mtn.merchant_code' => '123456']);
        $client = $this->client();
        $admin = User::factory()->create(['email' => 'reject-admin@example.com']);
        $admin->assignRole('moderator');
        $service = app(PaymentService::class);
        $payment = $service->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'daily', 'mtn_momo');
        $service->submit($payment, [
            'payer_phone' => '0772123456',
            'transaction_id' => '998877',
            'paid_at' => now()->subMinute()->toDateTimeString(),
        ], null);

        $service->reject($payment->fresh(), $admin, 'Transaction could not be found in our merchant account.');

        $this->assertSame(PaymentStatus::Rejected, $payment->fresh()->status);
        $this->assertFalse($client->fresh()->hasActivePlan(Subscription::PLAN_CLIENT_PREMIUM));

        $this->expectException(ValidationException::class);
        $service->reject($payment->fresh(), $admin, '   ');
    }

    public function test_admin_can_open_the_payment_list_and_review_screen(): void
    {
        config(['payments.mtn.merchant_code' => '123456']);
        $client = User::factory()->create([
            'account_kind' => 'client',
            'name' => 'Pay Client',
            'email' => 'pay-client@example.com',
        ]);
        $client->assignRole('client_free');
        $admin = User::factory()->create(['email' => 'list-admin@example.com']);
        $admin->assignRole('super_admin');
        $service = app(PaymentService::class);
        $payment = $service->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'mtn_momo');
        $service->submit($payment, [
            'payer_phone' => '0772123456',
            'transaction_id' => '555000111',
            'paid_at' => now()->subMinutes(3)->toDateTimeString(),
        ], null);

        $this->actingAs($admin, 'admin')
            ->get('/admin/payments')
            ->assertOk()
            ->assertSee('Pay Client')
            ->assertSee('555000111')
            ->assertSee('Submitted');

        $this->actingAs($admin, 'admin')
            ->get('/admin/payments/'.$payment->id)
            ->assertOk()
            ->assertSee('Verify payment')
            ->assertSee('Reject payment')
            ->assertSee('Subscription request')
            ->assertSee('Payment claim')
            ->assertSee('pay-client@example.com')
            ->assertSee($payment->reference);
    }

    public function test_expired_window_removes_access_before_the_cleanup_job(): void
    {
        $client = $this->client();
        $subscription = $client->activatePlan(Subscription::PLAN_CLIENT_PREMIUM, 'daily');
        $subscription->update(['ends_at' => now()->subMinute()]);

        $this->assertFalse($client->fresh()->hasActivePlan(Subscription::PLAN_CLIENT_PREMIUM));
    }

    private function client(): User
    {
        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        return $client;
    }

    /**
     * @return array<string, bool>
     */
    private function checks(): array
    {
        return [
            'transaction_exists' => true,
            'transaction_matches' => true,
            'amount_matches' => true,
            'payment_received' => true,
            'not_reused' => true,
        ];
    }
}
