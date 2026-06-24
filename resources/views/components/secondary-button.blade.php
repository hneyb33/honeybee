<button {{ $attributes->merge(['type' => 'button', 'class' => 'inline-flex items-center rounded-xl border border-gold-400/25 bg-ebony-850 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ebony-900 shadow-sm transition duration-150 ease-in-out hover:bg-gold-300/15 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 disabled:opacity-25']) }}>
    {{ $slot }}
</button>
