<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center rounded-xl border border-transparent bg-[#0f0a0a] px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#767f88] focus:bg-[#767f88] focus:outline-none focus:ring-2 focus:ring-[#767f88] focus:ring-offset-2 active:bg-[#0f0a0a] dark:ring-1 dark:ring-white']) }}>
    {{ $slot }}
</button>
