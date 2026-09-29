@php
    $profile = $escort ?? null;
    $whatsappCode = old('whatsapp_code', $profile->whatsapp_code ?? '+256');
    $telegramCode = old('telegram_code', $profile->telegram_code ?? '+256');
@endphp

<div class="grid gap-5 md:grid-cols-2">
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">WhatsApp code</span>
        <select name="whatsapp_code" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
            @foreach (\App\Models\Escort::DIAL_CODES as $code => $label)
                <option value="{{ $code }}" @selected($whatsappCode === $code)>{{ $label }}</option>
            @endforeach
        </select>
    </label>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">WhatsApp number</span>
        <input name="whatsapp_number" value="{{ old('whatsapp_number', $profile->whatsapp_number ?? '') }}" required placeholder="700000000" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
        @error('whatsapp_number') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Telegram code</span>
        <select name="telegram_code" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
            @foreach (\App\Models\Escort::DIAL_CODES as $code => $label)
                <option value="{{ $code }}" @selected($telegramCode === $code)>{{ $label }}</option>
            @endforeach
        </select>
    </label>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Telegram number</span>
        <input name="telegram" value="{{ old('telegram', $profile->telegram ?? '') }}" placeholder="700000000" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
    </label>
</div>
