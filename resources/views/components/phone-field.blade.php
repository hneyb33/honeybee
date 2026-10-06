@props([
    'country' => '256',
    'national' => '',
    'id' => 'phone',
])

@php
    $selected = (string) old('phone_country', $country);
    $number = old('phone', $national);
@endphp

<div class="mt-1 flex gap-2">
    <select
        id="{{ $id }}_country"
        name="phone_country"
        class="w-44 shrink-0 rounded-md border border-[#767f88] bg-white px-2 py-2 text-sm text-[#0f0a0a] dark:bg-[#241e1e] dark:text-white"
        autocomplete="tel-country-code"
    >
        @foreach (\App\Support\CountryDialCodes::options() as $code => $label)
            <option value="{{ $code }}" @selected($selected === (string) $code)>{{ $label }}</option>
        @endforeach
    </select>
    <x-text-input
        id="{{ $id }}"
        class="block w-full"
        type="tel"
        inputmode="tel"
        name="phone"
        :value="$number"
        placeholder="771234567"
        required
        autocomplete="tel-national"
    />
</div>
