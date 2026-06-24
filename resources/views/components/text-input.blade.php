@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 shadow-sm shadow-ink-950/5 placeholder:text-ebony-900/40 focus:border-gold-400 focus:ring-gold-400']) }}>
