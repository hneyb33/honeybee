<header class="sticky top-0 z-50 border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <a href="{{ route('home') }}" class="shrink-0">
            <img src="{{ asset('images/logo.jpeg') }}" alt="Honeybee" class="h-14 w-auto object-contain">
        </a>

        <div class="hidden items-center gap-8 text-sm font-medium text-neutral-800 md:flex">
            <a href="{{ route('home') }}" class="inline-flex items-center gap-2 border-b-2 border-neutral-900 pb-2">
                <x-lucide name="compass" /> Explore
            </a>
            @auth
                <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-2 pb-2 text-neutral-500">
                    <x-lucide name="layout-dashboard" /> Dashboard
                </a>
            @endauth
        </div>

        <div class="flex items-center gap-3">
            <x-theme-toggle />
            @auth
                @if (auth()->user()->isSpecialist())
                    <a href="{{ route('owner.escorts.create') }}" class="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
                        <x-lucide name="badge-plus" /> List your profile
                    </a>
                @endif
            @else
                <a href="{{ route('register') }}" class="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
                    <x-lucide name="user-plus" /> Register as
                </a>
            @endauth
            <div class="relative" x-data="{ open: false }">
                <button type="button" @click="open = ! open" class="flex items-center gap-3 rounded-full border border-neutral-300 py-1 pl-3 pr-1 hover:shadow-md" aria-label="Account">
                    <span class="flex flex-col gap-1">
                        <span class="h-0.5 w-4 rounded-full bg-neutral-800"></span>
                        <span class="h-0.5 w-4 rounded-full bg-neutral-800"></span>
                    </span>
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-white">{{ strtoupper(substr(auth()->user()->name ?? 'G', 0, 1)) }}</span>
                </button>
                <div x-show="open" x-transition @click.outside="open = false" class="absolute right-0 mt-2 w-60 rounded-xl border border-neutral-200 bg-white py-2 text-sm shadow-lg">
                    @auth
                        <a href="{{ route('dashboard') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                            <x-lucide name="layout-dashboard" /> Dashboard
                        </a>
                        @if (auth()->user()->isClient() && ! auth()->user()->isPremiumClient())
                            <a href="{{ route('subscribe') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                                <x-lucide name="crown" /> Upgrade to premium
                            </a>
                        @endif
                        @if (auth()->user()->isModel() && ! auth()->user()->hasActiveVipSubscription())
                            <a href="{{ route('subscribe') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                                <x-lucide name="crown" /> Subscribe for VIP
                            </a>
                        @endif
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-neutral-100">
                                <x-lucide name="log-out" /> Log out
                            </button>
                        </form>
                    @else
                        <a href="{{ route('login') }}" class="flex items-center gap-2 px-4 py-2.5 font-semibold hover:bg-neutral-100">
                            <x-lucide name="log-in" /> Log in
                        </a>
                        <a href="{{ route('register') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                            <x-lucide name="user-plus" /> Register as
                        </a>
                    @endauth
                </div>
            </div>
        </div>
    </div>
    <livewire:search.capsule-search />
    <livewire:listings.tier-filter />
</header>
