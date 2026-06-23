<x-layouts.app title="My listings - Real Estates UG">
    <section class="px-5 py-10 lg:px-10">
        <div class="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
                <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-gold-400">The Hive</p>
                <h1 class="font-display text-4xl font-semibold">My services</h1>
            </div>
            <a href="{{ route('owner.escorts.create') }}" class="inline-flex items-center justify-center rounded-full bg-gold-400 px-6 py-3 text-sm font-extrabold text-ink-950 transition hover:bg-gold-300">
                Add services
            </a>
        </div>
S
        @if (session('status'))
            <div class="mb-6 rounded-2xl border border-gold-400/25 bg-gold-400/10 p-4 text-sm font-bold text-gold-300">
                {{ session('status') }}
            </div>
        @endif

        @if ($escorts->isEmpty())
            <div class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-8">
                <h2 class="font-display text-2xl font-semibold">No listings yet</h2>
                <p class="mt-2 max-w-xl text-sm leading-6 text-ivory-50/60">Create your first service listing with photos, pricing, details, amenities, and a direct WhatsApp contact.</p>
            </div>
        @else
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                @foreach ($escorts as $escort)
                    <div class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-4">
                        <div class="mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-ink-950">
                            @if ($escort->cover_image)
                                <img src="{{ $escort->cover_image }}" alt="{{ $escort->title }}" class="h-full w-full object-cover">
                            @endif
                        </div>
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h2 class="font-bold">{{ $escort->title }}</h2>
                                <p class="mt-1 text-sm text-ivory-50/55">{{ $escort->neighborhood }}, {{ $escort->city }}</p>
                            </div>
                            <span class="rounded-full border border-gold-400/20 px-3 py-1 text-xs font-extrabold uppercase text-gold-400">{{ $escort->status }}</span>
                        </div>
                        <div class="mt-4 flex items-center justify-between text-sm">
                            <span class="font-bold">{{ $escort->price_label }}</span>
                            <a href="{{ route('escort.show', $escort) }}" class="font-bold text-gold-400 underline-offset-4 hover:underline">View</a>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </section>
</x-layouts.app>
