<x-filament-panels::page>
    @if (session('status'))
        <p class="mb-4 text-sm">{{ session('status') }}</p>
    @endif
    <form wire:submit="save" class="max-w-3xl space-y-8">
        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Support account</h2>
            <label class="block text-sm">Support email
                <input wire:model="data.support_email" class="mt-1 w-full rounded-lg border px-3 py-2">
            </label>
        </section>
        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Payment channels</h2>
            <label class="block text-sm">Mobile money name<input wire:model="data.mobile_money_name" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
            <label class="block text-sm">Mobile money number<input wire:model="data.mobile_money_number" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
            <label class="block text-sm">Bank name<input wire:model="data.bank_name" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
            <label class="block text-sm">Account name<input wire:model="data.bank_account_name" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
            <label class="block text-sm">Account number<input wire:model="data.bank_account_number" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
        </section>
        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Subscription prices (UGX)</h2>
            <p class="text-sm text-gray-500">Daily, monthly, yearly, and custom periods on the public subscription page use these prices.</p>
            @foreach (['client_premium' => 'Client premium', 'specialist' => 'Specialist'] as $plan => $label)
                <h3 class="font-medium">{{ $label }}</h3>
                <div class="grid gap-3 md:grid-cols-2">
                    <label class="text-sm">Daily<input wire:model="data.{{ $plan }}_daily_price" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
                    <label class="text-sm">Monthly<input wire:model="data.{{ $plan }}_monthly_price" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
                    <label class="text-sm">Yearly<input wire:model="data.{{ $plan }}_yearly_price" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
                    <label class="text-sm">Custom price<input wire:model="data.{{ $plan }}_custom_price" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
                    <label class="text-sm">Custom days<input wire:model="data.{{ $plan }}_custom_days" class="mt-1 w-full rounded-lg border px-3 py-2"></label>
                </div>
            @endforeach
        </section>
        <button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Save settings</button>
    </form>
</x-filament-panels::page>
