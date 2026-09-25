<x-layouts.app title="Subscribe - Honeybee">
    @php
        $plan = auth()->user()->isClient() ? 'client_premium' : 'specialist';
        $action = auth()->user()->isClient() ? route('client.subscribe') : route('owner.subscribe');
    @endphp
    <section class="mx-auto max-w-3xl px-6 py-10">
        <h1 class="text-3xl font-semibold text-neutral-900">Subscription</h1>
        <p class="mt-2 text-sm text-neutral-600">Prices and periods are set in the admin settings.</p>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            @foreach (['daily' => 'Daily', 'monthly' => 'Monthly', 'yearly' => 'Yearly', 'custom' => 'Custom'] as $period => $label)
                <form method="POST" action="{{ $action }}" class="rounded-xl border border-neutral-200 p-4">
                    @csrf
                    <input type="hidden" name="period" value="{{ $period }}">
                    <h2 class="font-semibold">{{ $label }}</h2>
                    <p class="mt-1 text-sm text-neutral-600">UGX {{ number_format((int) \App\Models\Setting::get($plan.'_'.$period.'_price', 0)) }}</p>
                    @if ($period === 'custom')
                        <p class="text-xs text-neutral-500">{{ \App\Models\Setting::get($plan.'_custom_days', 30) }} days</p>
                    @endif
                    <button class="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Choose {{ $label }}</button>
                </form>
            @endforeach
        </div>
        <div class="mt-8 text-sm text-neutral-700">
            <h2 class="font-semibold text-neutral-900">Pay to</h2>
            <p class="mt-2">{{ \App\Models\Setting::get('mobile_money_name') }} {{ \App\Models\Setting::get('mobile_money_number') }}</p>
            <p>{{ \App\Models\Setting::get('bank_name') }} · {{ \App\Models\Setting::get('bank_account_name') }} · {{ \App\Models\Setting::get('bank_account_number') }}</p>
        </div>
    </section>
</x-layouts.app>
