@props(['id', 'name', 'autocomplete' => 'current-password'])

<div class="relative" x-data="{ show: false }">
    <input
        id="{{ $id }}"
        name="{{ $name }}"
        autocomplete="{{ $autocomplete }}"
        type="password"
        x-bind:type="show ? 'text' : 'password'"
        {{ $attributes->merge(['class' => 'block w-full rounded-xl border border-[#d0d4d8] bg-[#ffffff] px-4 py-3 pe-12 text-sm text-[#0f0a0a] shadow-sm focus:border-[#767f88] focus:ring-[#767f88] dark:border-[#767f88] dark:bg-[#241e1e] dark:text-white']) }}
        required
    >
    <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-[#767f88]" @click="show = ! show" :aria-label="show ? 'Hide password' : 'Show password'">
        <svg x-show="! show" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
        <svg x-show="show" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-4.1 4.8" />
            <path d="M6.1 6.1C3.7 7.9 2 12 2 12a18.4 18.4 0 0 0 6.2 6.7" />
        </svg>
    </button>
</div>
