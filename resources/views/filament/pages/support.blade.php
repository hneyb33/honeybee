<x-filament-panels::page>
    @if (session('status'))
        <p class="mb-4 text-sm">{{ session('status') }}</p>
    @endif
    <form wire:submit="save" class="max-w-3xl space-y-4">
        <label class="block text-sm">Privacy policy
            <textarea wire:model="data.privacy_policy" rows="8" class="mt-1 w-full rounded-lg border px-3 py-2"></textarea>
        </label>
        <label class="block text-sm">Terms and conditions
            <textarea wire:model="data.terms" rows="8" class="mt-1 w-full rounded-lg border px-3 py-2"></textarea>
        </label>
        <label class="block text-sm">Complaints Telegram
            <input wire:model="data.complaints_telegram" class="mt-1 w-full rounded-lg border px-3 py-2" placeholder="username">
        </label>
        <p class="text-sm text-gray-500">These appear on the public privacy page, terms page, and footer.</p>
        <button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Save support</button>
    </form>
</x-filament-panels::page>
