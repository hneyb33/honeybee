<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center rounded-xl border border-transparent bg-gold-400 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ink-950 transition duration-150 ease-in-out hover:bg-gold-300 focus:bg-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 active:bg-gold-500']) }}>
    {{ $slot }}
</button>
