<x-layouts.app title="Subscribe - Honeybee">
    @php
        $plan = $plan ?? (auth()->user()->isClient() ? 'client_premium' : 'specialist');
        $action = auth()->user()->isClient() ? route('client.subscribe') : route('owner.subscribe');
        $paymentsEnabled = $paymentsEnabled ?? false;
        $providers = $providers ?? [];
    @endphp
    <section class="mx-auto max-w-3xl px-6 py-10">
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
        <h1 class="inline-flex items-center gap-2 text-3xl font-semibold text-neutral-900">
            <x-lucide name="credit-card" />
            {{ $plan === 'escort_vip' ? 'VIP subscription' : ($plan === 'client_premium' ? 'Premium subscription' : 'Specialist subscription') }}
        </h1>
        @if ($paymentsEnabled)
            <p class="mt-2 text-sm text-neutral-600">Choose a plan, pay the exact amount with mobile money, then send the transaction details. Access starts after the payment is verified.</p>
        @else
            <p class="mt-2 text-sm text-neutral-600">Payment is skipped until an MTN or Airtel merchant code is set. Choosing a plan activates it now.</p>
        @endif
        @if (! empty($openPayment))
            <p class="mt-4 rounded-lg border border-neutral-200 px-4 py-3 text-sm">
                <a href="{{ route('payments.show', $openPayment) }}" class="font-semibold text-neutral-900 underline">{{ $openPayment->reference }}</a>
                is {{ $openPayment->status->label() }}.
            </p>
        @endif
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            @foreach (['daily' => 'Daily', 'monthly' => 'Monthly', 'yearly' => 'Yearly', 'custom' => 'Custom'] as $period => $label)
                <form method="POST" action="{{ $action }}" class="rounded-xl border border-neutral-200 p-4">
                    @csrf
                    <input type="hidden" name="period" value="{{ $period }}">
                    <h2 class="font-semibold text-neutral-900">{{ $label }}</h2>
                    <p class="mt-1 text-sm text-neutral-600">UGX {{ number_format((int) \App\Models\Setting::get($plan.'_'.$period.'_price', 0)) }}</p>
                    @if ($period === 'custom')
                        <p class="text-xs text-neutral-500">{{ \App\Models\Setting::get($plan.'_custom_days', 30) }} days</p>
                    @endif
                    @if ($paymentsEnabled)
                        <fieldset class="mt-3 space-y-2">
                            <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pay with</legend>
                            @foreach ($providers as $code => $provider)
                                <label class="flex items-center gap-2 text-sm text-neutral-800">
                                    <input type="radio" name="provider" value="{{ $code }}" @checked($loop->first) required>
                                    <span>{{ $provider->label() }}</span>
                                </label>
                            @endforeach
                        </fieldset>
                    @endif
                    <button class="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f0a0a] px-4 py-2 text-sm font-semibold text-white dark:ring-1 dark:ring-white">
                        <x-lucide name="credit-card" /> {{ $paymentsEnabled ? 'Continue to payment' : 'Choose '.$label }}
                    </button>
                </form>
            @endforeach
        </div>
    </section>
</x-layouts.app>
