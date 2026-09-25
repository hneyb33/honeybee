<header class="sticky top-0 z-50 border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <a href="{{ route('home') }}" class="shrink-0">
            <img src="{{ asset('images/logo.jpeg') }}" alt="Honeybee" class="h-14 w-auto object-contain">
        </a>

        <div class="hidden items-center gap-8 text-sm font-medium text-neutral-800 md:flex">
            <a href="{{ route('home') }}" class="border-b-2 border-neutral-900 pb-2">Explore</a>
            @auth
                @if (auth()->user()->isSpecialist())
                    <a href="{{ route('owner.escorts.index') }}" class="pb-2 text-neutral-500">Dashboard</a>
                @else
                    <a href="{{ route('dashboard') }}" class="pb-2 text-neutral-500">Trips</a>
                @endif
            @endauth
        </div>

        <div class="flex items-center gap-3">
            @auth
                @if (auth()->user()->isSpecialist())
                    <a href="{{ route('owner.escorts.create') }}" class="hidden text-sm font-medium text-neutral-800 sm:inline">List your profile</a>
                @endif
            @else
                <a href="{{ route('register') }}" class="hidden text-sm font-medium text-neutral-800 sm:inline">Register as</a>
            @endauth
            <div class="relative" x-data="{ open: false }">
                <button type="button" @click="open = ! open" class="flex items-center gap-3 rounded-full border border-neutral-300 py-1 pl-3 pr-1 hover:shadow-md" aria-label="Account">
                    <span class="flex flex-col gap-1">
                        <span class="h-0.5 w-4 rounded-full bg-neutral-800"></span>
                        <span class="h-0.5 w-4 rounded-full bg-neutral-800"></span>
                    </span>
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-white">{{ strtoupper(substr(auth()->user()->name ?? 'G', 0, 1)) }}</span>
                </button>
                <div x-show="open" x-transition @click.outside="open = false" class="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-2 text-sm shadow-lg">
                    @auth
                        <a href="{{ route('dashboard') }}" class="block px-4 py-2.5 hover:bg-neutral-100">Dashboard</a>
                        @if (auth()->user()->isClient() && ! auth()->user()->isPremiumClient())
                            <a href="{{ route('subscribe') }}" class="block w-full px-4 py-2.5 text-left hover:bg-neutral-100">Upgrade to premium</a>
                        @endif
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="block w-full px-4 py-2.5 text-left hover:bg-neutral-100">Log out</button>
                        </form>
                    @else
                        <a href="{{ route('login') }}" class="block px-4 py-2.5 font-semibold hover:bg-neutral-100">Log in</a>
                        <a href="{{ route('register') }}" class="block px-4 py-2.5 hover:bg-neutral-100">Register as</a>
                    @endauth
                </div>
            </div>
        </div>
    </div>
    <livewire:search.capsule-search />
    <livewire:listings.tier-filter />
</header>
