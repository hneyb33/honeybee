<x-layouts.app title="Payment {{ $payment->reference }} - Honeybee">
    <section class="mx-auto max-w-2xl px-6 py-10">
        @if (session('status'))
            <p class="mb-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif
        @if ($errors->any())
            <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">{{ $payment->status->label() }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-neutral-900">{{ $payment->reference }}</h1>
        <p class="mt-2 text-sm text-neutral-600">Your subscription stays pending until this payment has been verified.</p>

        <dl class="mt-6 space-y-3 rounded-xl border border-neutral-200 p-4 text-sm">
            <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Amount</dt>
                <dd class="font-semibold text-neutral-900">UGX {{ number_format($payment->amount) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Plan</dt>
                <dd class="font-semibold text-neutral-900">{{ $payment->planLabel() }} – {{ $payment->durationLabel() }}</dd>
            </div>
            <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Reference</dt>
                <dd class="font-semibold text-neutral-900">{{ $payment->reference }}</dd>
            </div>
        </dl>

        @if ($payment->status === \App\Enums\PaymentStatus::Pending)
            <div class="mt-6 space-y-4">
                @foreach ($providers as $provider)
                    <div class="rounded-xl border border-neutral-200 p-4">
                        <h2 class="inline-flex items-center gap-2 font-semibold text-neutral-900"><x-lucide name="credit-card" /> {{ $provider->label() }}</h2>
                        <p class="mt-2 text-sm text-neutral-600">Merchant code</p>
                        <p class="mt-1 text-2xl font-semibold tracking-wide text-neutral-900">{{ $provider->merchantCode() }}</p>
                        <p class="mt-3 text-sm text-neutral-700">{{ $provider->instructions() }}</p>
                    </div>
                @endforeach
                <p class="text-sm text-neutral-600">Honeybee never asks for your Mobile Money PIN. After you pay, return here and send the transaction details.</p>
            </div>

            <form method="POST" action="{{ route('payments.submit', $payment) }}" enctype="multipart/form-data" class="mt-8 space-y-4">
                @csrf
                <fieldset class="space-y-2">
                    <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment method</legend>
                    @foreach ($providers as $code => $provider)
                        <label class="flex items-center gap-2 text-sm text-neutral-800">
                            <input type="radio" name="provider" value="{{ $code }}" @checked(old('provider', $payment->provider?->value) === $code) required>
                            <span>{{ $provider->label() }}</span>
                        </label>
                    @endforeach
                </fieldset>
                <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone number used</span>
                    <input name="payer_phone" value="{{ old('payer_phone') }}" required placeholder="0772 XXX XXX" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Transaction ID</span>
                    <input name="transaction_id" value="{{ old('transaction_id') }}" required maxlength="100" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment date and time</span>
                    <input type="datetime-local" name="paid_at" value="{{ old('paid_at') }}" max="{{ now()->format('Y-m-d\TH:i') }}" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment screenshot or SMS</span>
                    <input type="file" name="proof" accept="image/jpeg,image/png,image/webp" class="block w-full text-sm text-neutral-700">
                </label>
                <p class="text-sm text-neutral-600">Amount due: UGX {{ number_format($payment->amount) }}. This comes from the plan and cannot be changed here.</p>
                <button class="inline-flex items-center gap-2 rounded-xl bg-[#0f0a0a] px-4 py-3 text-sm font-semibold text-white dark:ring-1 dark:ring-white"><x-lucide name="credit-card" /> Submit payment for verification</button>
            </form>
        @elseif ($payment->status === \App\Enums\PaymentStatus::Submitted)
            <div class="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">Waiting for verification</p>
                <p class="mt-2">{{ $payment->provider?->label() }} · {{ \App\Models\Payment::displayPhone($payment->payer_phone) }} · {{ $payment->transaction_id }}</p>
                <p class="mt-2">Submitted {{ $payment->submitted_at?->format('j M Y, g:i A') }}. Sending these details does not activate the plan.</p>
            </div>
        @elseif ($payment->status === \App\Enums\PaymentStatus::Verified)
            <div class="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">Payment verified</p>
                <p class="mt-2">{{ $payment->verifiedSummary() }}</p>
            </div>
        @elseif ($payment->status === \App\Enums\PaymentStatus::Rejected)
            <div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p class="font-semibold">Payment verification unsuccessful</p>
                <p class="mt-2">{{ $payment->rejectedSummary() }}</p>
                <a href="{{ route('subscribe') }}" class="mt-4 inline-block font-semibold underline">Choose a plan again</a>
            </div>
        @endif
    </section>
</x-layouts.app>
