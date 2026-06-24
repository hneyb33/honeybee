<x-layouts.app :title="$escort->title.' - HoneyBee Escorts'">
    <div class="px-5 py-8 lg:px-10">
        @if (session('status'))
            <div class="mb-6 rounded-2xl border border-gold-400/25 bg-gold-400/10 p-4 text-sm font-bold text-gold-300">
                {{ session('status') }}
            </div>
        @endif

        <div class="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
                <h1 class="font-display text-3xl font-semibold md:text-4xl">{{ $escort->title }}</h1>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-ebony-900/70">
                    <span class="flex items-center gap-1 font-bold text-ink-950">
                        <svg class="h-3 w-3 fill-gold-400" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z"/></svg>
                        {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 2) : 'New' }}
                    </span>
                    <span class="text-ebony-900/30">-</span>
                    <span>{{ $escort->review_count }} {{ Str::plural('review', $escort->review_count) }}</span>
                    <span class="text-ebony-900/30">-</span>
                    <span>{{ $escort->neighborhood }}, {{ $escort->city }}</span>
                </div>
            </div>
            <div class="flex gap-2 text-sm font-bold">
                <button type="button" class="rounded-lg px-3 py-2 underline underline-offset-4 hover:bg-gold-300/15">Share</button>
                <button type="button" class="rounded-lg px-3 py-2 underline underline-offset-4 hover:bg-gold-300/15">Save</button>
            </div>
        </div>

        <x-photo-grid :escort="$escort" />

        <div class="mt-9 grid gap-12 lg:grid-cols-[1.7fr_1fr]">
            <div>
                <div class="mb-7 flex items-center justify-between gap-5 border-b border-gold-400/20 pb-7">
                    <div>
                    <h2 class="font-display text-2xl font-semibold">{{ ucfirst($escort->tier) }} hosted by {{ $escort->owner?->name ?? 'HoneyBee' }}</h2>
                    <p class="mt-1 text-sm text-ebony-900/65">{{ $escort->age }} yrs · {{ ucfirst($escort->gender) }} · {{ $escort->ethnicity ?: 'Verified' }} · {{ $escort->nationality ?: 'Local' }}</p>
                    <p class="mt-2 text-sm text-ebony-900/65">{{ $escort->height }} · {{ $escort->weight }} · {{ ucfirst($escort->hair_color) }} hair · {{ $escort->availability }}</p>
                </div>
                <div class="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-gold-400 to-caramel-500"></div>
            </div>

            <div class="mb-7 space-y-5 border-b border-gold-400/20 pb-7">
                <div class="flex gap-4">
                    <span class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold-400/20 bg-ebony-850">
                        <svg class="h-4 w-4 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>
                    </span>
                    <div>
                        <strong class="block">Available services</strong>
                        <span class="text-sm text-ebony-900/65">Choose from a curated selection of companionship and pleasure experiences.</span>
                    </div>
                </div>
                <div class="flex gap-4">
                    <span class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold-400/20 bg-ebony-850">
                        <svg class="h-4 w-4 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7 9 18l-5-5"/></svg>
                    </span>
                    <div>
                        <strong class="block">Verified by HoneyBee Escorts</strong>
                        <span class="text-sm text-ebony-900/65">We ensure responsible experience, discretion, and respect for all parties involved.</span>
                    </div>
                </div>
                @foreach ($escort->amenities ?: [] as $amenity)
                    <div class="flex gap-4">
                        <span class="mt-1 h-8 w-8 shrink-0 rounded-md border border-gold-400/20 bg-ebony-850"></span>
                        <div>
                            <strong class="block">{{ $amenity['title'] }}</strong>
                            <span class="text-sm text-ebony-900/65">{{ $amenity['body'] }}</span>
                        </div>
                    </div>
                @endforeach
            </div>

                <section class="border-b border-gold-400/20 pb-8">
                    <h2 class="mb-4 font-display text-2xl font-semibold">About Me</h2>
                    <p class="max-w-2xl text-[0.95rem] leading-8 text-ebony-900/80">{{ $escort->description }}</p>
                </section>

                <section class="border-b border-gold-400/20 py-8">
                    <h2 class="mb-5 font-display text-2xl font-semibold">What I offer</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        @foreach (collect($escort->services_offered ?: [])->take(8) as $service)
                            <div class="rounded-xl border border-gold-400/15 bg-ebony-850 p-4 text-sm text-ebony-900/85 shadow-sm shadow-ink-950/5">
                                {{ $service }}
                            </div>
                        @endforeach
                    </div>
                </section>

                <section class="py-8">
                    <h2 class="mb-4 font-display text-2xl font-semibold">Where would you like the fun</h2>
                    <div class="overflow-hidden rounded-2xl border border-gold-400/20 bg-ebony-850 shadow-lg shadow-ink-950/5">
                        <div class="flex h-64 items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(201,145,47,0.28),transparent_30%),linear-gradient(135deg,#fffaf0,#f3dfbf)]">
                            <div class="rounded-full border border-gold-400/30 bg-ivory-50/85 px-5 py-3 text-sm font-extrabold text-gold-500">{{ $escort->neighborhood }}, {{ $escort->city }}</div>
                        </div>
                    </div>
                </section>
            </div>

            <livewire:escort.booking-dock :escort="$escort" />
        </div>
    </div>
</x-layouts.app>
