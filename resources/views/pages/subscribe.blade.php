<x-layouts.app title="Subscribe - Honeybee">
    @php
        $user = auth()->user();
        $plans = $plans ?? \App\Models\Subscription::plansFor($user);
        $action = $user->isClient() ? route('client.subscribe') : route('owner.subscribe');
        $paymentsEnabled = $paymentsEnabled ?? false;
        $providers = $providers ?? [];
        $periods = ['daily' => 'Daily', 'monthly' => 'Monthly'];
    @endphp
    <section class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
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
        <h1 class="inline-flex items-center gap-2 text-2xl font-semibold text-neutral-900 sm:text-3xl">
            <x-lucide name="credit-card" /> Subscriptions
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

        @foreach ($plans as $plan)
            <div class="mt-8">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 class="text-lg font-semibold text-neutral-900">{{ \App\Models\Subscription::label($plan) }}</h2>
                    @if ($user->hasActivePlan($plan))
                        <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">Active</span>
                    @endif
                </div>
                <p class="mt-1 text-sm text-neutral-600">{{ \App\Models\Subscription::description($plan) }}</p>
                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    @foreach ($periods as $period => $label)
                        <form method="POST" action="{{ $action }}" class="rounded-xl border border-neutral-200 p-4">
                            @csrf
                            <input type="hidden" name="plan" value="{{ $plan }}">
                            <input type="hidden" name="period" value="{{ $period }}">
                            <h3 class="font-semibold text-neutral-900">{{ $label }}</h3>
                            <p class="mt-1 text-sm text-neutral-600">UGX {{ number_format((int) \App\Models\Setting::get($plan.'_'.$period.'_price', 0)) }}</p>
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
                            <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f0a0a] px-4 py-2.5 text-sm font-semibold text-white dark:ring-1 dark:ring-white sm:w-auto">
                                <x-lucide name="credit-card" /> {{ $paymentsEnabled ? 'Continue to payment' : 'Choose '.$label }}
                            </button>
                        </form>
                    @endforeach
                </div>
            </div>
        @endforeach
    </section>
</x-layouts.app>
