<aside
    class="sticky top-28 h-fit rounded-2xl border border-gold-400/20 bg-ebony-850 p-6 shadow-2xl shadow-black/35"
    x-data
    x-init="if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from($el, { opacity: 0, y: 18, duration: 0.55, delay: 0.15, ease: 'power2.out' })"
>
    <div class="mb-5 flex items-baseline justify-between gap-3">
        <div class="text-xl font-extrabold">UGX {{ number_format($escort->monthly_price) }} <span class="text-sm font-medium text-ivory-50/50">/ hour</span></div>
        <div class="flex items-center gap-1 text-sm font-bold">
            <svg class="h-3 w-3 fill-gold-400" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z"/></svg>
            {{ number_format((float) $escort->rating, 2) }}
        </div>
    </div>

    <div class="mb-4 overflow-hidden rounded-xl border border-gold-400/20">
        <div class="grid grid-cols-2">
            <label class="border-b border-r border-gold-400/20 p-3">
                <span class="block text-[10px] font-extrabold uppercase tracking-wide text-gold-400">Appointment</span>
                <input type="date" wire:model="appointmentDate" class="w-full bg-transparent p-0 text-sm text-ivory-50 focus:outline-none">
            </label>
            <label class="border-b border-gold-400/20 p-3">
                <span class="block text-[10px] font-extrabold uppercase tracking-wide text-gold-400">Duration</span>
                <select wire:model="duration" class="w-full appearance-none bg-transparent p-0 text-sm text-ivory-50 focus:outline-none">
                    <option class="text-ink-950" value="1">1 hour</option>
                    <option class="text-ink-950" value="3">3 hours</option>
                    <option class="text-ink-950" value="6">6 hours</option>
                </select>
            </label>
        </div>
        <label class="block p-3">
            <span class="block text-[10px] font-extrabold uppercase tracking-wide text-gold-400">Experience type</span>
            <select wire:model="experienceType" class="w-full appearance-none bg-transparent p-0 text-sm text-ivory-50 focus:outline-none">
                <option class="text-ink-950" value="Incall">Incall</option>
                <option class="text-ink-950" value="Outcall">Outcall</option>
                <option class="text-ink-950" value="VIP">VIP</option>
            </select>
        </label>
    </div>

    @error('moveInDate')
        <p class="mb-3 text-xs font-semibold text-red-300">{{ $message }}</p>
    @enderror

    @if ($requested)
        <p class="mb-3 rounded-xl border border-gold-400/25 bg-gold-400/10 p-3 text-sm font-semibold text-gold-300">Request received. Your companion will contact you shortly.</p>
    @endif

    <button wire:click="requestBooking" wire:loading.attr="disabled" class="mb-3 w-full rounded-xl bg-gold-400 py-3.5 text-sm font-extrabold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60">
        <span wire:loading.remove>Request to Book</span>
        <span wire:loading>Sending request...</span>
    </button>

    <a href="https://wa.me/{{ $escort->whatsapp_number }}?text={{ urlencode('Hi, I am interested in '.$escort->title) }}" target="_blank" class="flex w-full items-center justify-center gap-2 rounded-xl border border-green-400/35 bg-green-400/10 py-3.5 text-sm font-bold text-green-300 transition hover:bg-green-400/15">
        <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2zm5.81 14.07c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.38c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.64-.14.26.09 1.66.78 1.94.93.28.14.47.21.54.33.07.12.07.7-.17 1.38z"/></svg>
        Chat on WhatsApp
    </a>

    <p class="my-4 text-center text-xs text-ivory-50/40">You will not be charged yet</p>

    <div class="border-t border-gold-400/20 pt-3 text-sm">
        <div class="flex justify-between py-1.5 text-ivory-50/65"><span>Hourly Rate</span><span>UGX {{ number_format($escort->monthly_price) }}</span></div>
        <div class="flex justify-between py-1.5 text-ivory-50/65"><span>Corporate Event</span><span>UGX {{ number_format($this->serviceFee) }}</span></div>
        <div class="mt-2 flex justify-between border-t border-gold-400/20 pt-3.5 font-extrabold"><span>Charge for your experience</span><span>UGX {{ number_format($this->total) }}</span></div>
    </div>
</aside>
