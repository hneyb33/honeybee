@props(['value'])

<label {{ $attributes->merge(['class' => 'block text-sm font-bold text-ebony-900']) }}>
    {{ $value ?? $slot }}
</label>
