<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubscriptionPaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function plans(Request $request): View
    {
        $user = $request->user();
        abort_unless($user->isClient() || $user->isSpecialist(), 403);

        $plans = Subscription::plansFor($user) ?: [Subscription::PLAN_SPECIALIST];

        return view('pages.subscribe', [
            'plans' => $plans,
            'paymentsEnabled' => $this->payments->paymentsEnabled(),
            'providers' => $this->payments->availableProviders(),
            'openPayment' => Payment::query()
                ->where('user_id', $user->id)
                ->whereIn('status', [PaymentStatus::Pending, PaymentStatus::Submitted, PaymentStatus::Rejected])
                ->latest()
                ->first(),
        ]);
    }

    public function begin(Request $request): RedirectResponse
    {
        $user = $request->user();
        $allowed = Subscription::plansFor($user);
        abort_unless($allowed !== [], 403);

        $rules = [
            'period' => ['required', 'in:daily,monthly,yearly,custom'],
            'plan' => ['nullable', Rule::in($allowed)],
        ];

        if ($this->payments->paymentsEnabled()) {
            $rules['provider'] = ['required', Rule::in(array_keys($this->payments->availableProviders()))];
        }

        $validated = $request->validate($rules);
        $plan = $validated['plan'] ?? $allowed[0];

        if (! $this->payments->paymentsEnabled()) {
            $user->activatePlan($plan, $validated['period']);

            $message = Subscription::activationMessage($plan);

            return back()->with('status', $message);
        }

        $payment = $this->payments->start($user, $plan, $validated['period'], $validated['provider']);

        return redirect()->route('payments.show', $payment);
    }

    public function show(Request $request, Payment $payment): View
    {
        abort_unless($payment->user_id === $request->user()->id, 403);
        $payment->load('subscription');

        return view('pages.payments.show', [
            'payment' => $payment,
            'providers' => $this->payments->availableProviders(),
        ]);
    }

    public function submit(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->user_id === $request->user()->id, 403);
        abort_unless($payment->status === PaymentStatus::Pending, 403);

        $validated = $request->validate([
            'provider' => ['nullable', Rule::in(array_keys($this->payments->availableProviders()))],
            'payer_phone' => ['required', 'string', 'max:20'],
            'transaction_id' => ['required', 'string', 'max:100'],
            'paid_at' => ['required', 'date', 'before_or_equal:now'],
            'proof' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $this->payments->submit($payment, $validated, $request->file('proof'), $request);

        return redirect()
            ->route('payments.show', $payment)
            ->with('status', 'Payment submitted. It stays pending until an administrator verifies it.');
    }

    public function proof(Request $request, Payment $payment): StreamedResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        abort_unless($payment->proof_path && Storage::disk('local')->exists($payment->proof_path), 404);

        return Storage::disk('local')->response($payment->proof_path);
    }
}
