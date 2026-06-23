<header class="sticky top-0 z-50 border-b border-gold-400/20 bg-ink-950/90 backdrop-blur-xl">
    <div class="flex items-center justify-between gap-5 px-5 py-4 lg:px-10">
        <a href="{{ route('home') }}" class="font-display text-xl font-semibold tracking-wide">
            HoneyBee <span class="text-gold-400">Escorts</span>
        </a>

        <nav class="hidden items-end gap-9 md:flex" aria-label="Primary">
            @foreach (['VIP', 'Corporate', 'Business'] as $tab)
                <a href="{{ route('home') }}" @class([
                    'flex flex-col items-center gap-1.5 border-b-2 pb-3 text-sm font-bold transition',
                    'border-gold-400 text-ivory-50' => $loop->first,
                    'border-transparent text-ivory-50/50 hover:text-ivory-50' => ! $loop->first,
                ])>
                    <span @class([
                        'h-5 w-5 rounded-md',
                        'bg-gold-400' => $loop->first,
                        'bg-ivory-50/10' => ! $loop->first,
                    ])></span>
                    {{ $tab }}
                </a>
            @endforeach
        </nav>

        <div class="flex items-center gap-3">
            <a href="{{ route('owner.escorts.create') }}" class="hidden rounded-full px-4 py-2 text-sm font-bold transition hover:bg-ivory-50/5 sm:inline-flex">
                List your services
            </a>
            <div class="relative" x-data="{ open: false }">
                <button type="button" @click="open = ! open" class="flex items-center gap-2 rounded-full border border-gold-400/20 px-3 py-2 transition hover:border-gold-400/60" aria-label="Open account menu">
                    <span class="flex flex-col gap-1">
                        <span class="h-0.5 w-4 rounded-full bg-ivory-50/80"></span>
                        <span class="h-0.5 w-4 rounded-full bg-ivory-50/80"></span>
                    </span>
                    <span class="h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 to-caramel-500"></span>
                </button>

                <div x-show="open" x-transition @click.outside="open = false" class="absolute right-0 mt-3 w-56 rounded-2xl border border-gold-400/20 bg-ebony-850 p-2 text-sm font-bold shadow-2xl shadow-black/40">
                    @auth
                        <a href="{{ route('owner.escorts.index') }}" class="block rounded-xl px-4 py-3 text-ivory-50/80 hover:bg-ivory-50/5 hover:text-ivory-50">My Services</a>
                        <a href="{{ route('owner.escorts.create') }}" class="block rounded-xl px-4 py-3 text-ivory-50/80 hover:bg-ivory-50/5 hover:text-ivory-50">Add Services</a>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="block w-full rounded-xl px-4 py-3 text-left text-ivory-50/80 hover:bg-ivory-50/5 hover:text-ivory-50">Log out</button>
                        </form>
                    @else
                        <a href="{{ route('login') }}" class="block rounded-xl px-4 py-3 text-ivory-50/80 hover:bg-ivory-50/5 hover:text-ivory-50">Log in</a>
                        <a href="{{ route('register') }}" class="block rounded-xl px-4 py-3 text-ivory-50/80 hover:bg-ivory-50/5 hover:text-ivory-50">Create account</a>
                    @endauth
                </div>
            </div>
        </div>
    </div>

    <livewire:search.capsule-search />
    <livewire:listings.tier-filter />
</header>
