@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'rounded-xl border border-[#d0d4d8] bg-[#ffffff] px-4 py-3 text-sm text-[#0f0a0a] shadow-sm placeholder:text-[#767f88] focus:border-[#767f88] focus:ring-[#767f88] dark:border-[#767f88] dark:bg-[#241e1e] dark:text-white']) }}>
