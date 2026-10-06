<style>
    .hb-header { transition: transform 250ms ease; will-change: transform; }
    .hb-header-hidden { transform: translateY(-100%); }
    .hb-tools { display: flex; align-items: center; gap: 0.5rem; overflow-x: auto; padding: 0 1rem 0.75rem; scrollbar-width: none; }
    .hb-tools::-webkit-scrollbar { display: none; }
    .hb-desktop-search { display: none; }
    .hb-tier-root { display: none; }
    .hb-mobile-pills { display: flex; width: max-content; align-items: center; gap: 0.5rem; }
    @media (min-width: 768px) {
        .hb-tools { display: block; overflow: visible; padding: 0; }
        .hb-desktop-search { display: block; }
        .hb-mobile-pills { display: none; }
        .hb-tier-root { display: flex; align-items: flex-end; justify-content: center; gap: 2rem; overflow-x: auto; padding: 0 1.5rem 0.75rem; }
    }
    .hb-search-go { display: flex; height: 3rem; width: 3rem; align-items: center; justify-content: center; border-radius: 9999px; background: #FF385C; color: #fff; }
    .hb-chat, .hb-drop-go { border-radius: 9999px; background: #FF385C; color: #fff; }
    .hb-drop { position: fixed; left: 1rem; right: 1rem; top: 5.5rem; z-index: 70; border: 1px solid #ddd; border-radius: 1rem; background: #fff; padding: 0.75rem; box-shadow: 0 12px 40px rgba(0,0,0,.16); }
</style>
<header
    x-data="{ hidden: false, last: 0 }"
    x-init="last = window.scrollY"
    @scroll.window="
        const y = Math.max(window.scrollY, 0);
        hidden = y > last && y > 96;
        last = y;
    "
    :class="hidden && 'hb-header-hidden'"
    class="hb-header sticky top-0 z-50 border-b border-neutral-200 bg-white"
>
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <a href="{{ route('home') }}" class="shrink-0">
            <img src="{{ asset('images/logo-lightmode.jpeg') }}" alt="Honeybee" class="h-8 w-auto object-contain dark:hidden sm:h-10">
            <img src="{{ asset('images/logo-darkmode.jpeg') }}" alt="Honeybee" class="hidden h-8 w-auto object-contain dark:block sm:h-10">
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
                    <a href="{{ route('owner.escorts.create') }}" class="inline-flex items-center gap-2 text-sm font-medium text-neutral-800" aria-label="List your profile">
                        <x-lucide name="badge-plus" /> <span class="hidden sm:inline">List your profile</span>
                    </a>
                @endif
            @else
                <a href="{{ route('register') }}" class="inline-flex items-center gap-2 text-sm font-medium text-neutral-800" aria-label="Register as">
                    <x-lucide name="user-plus" /> <span class="hidden sm:inline">Register as</span>
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
                        @if (auth()->user()->isSpecialist() && ($ownProfile = auth()->user()->escorts()->latest('id')->first()))
                            <a href="{{ route('escort.show', $ownProfile) }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                                <x-lucide name="user" /> View my profile
                            </a>
                        @endif
                        @if (auth()->user()->isClient() && ! auth()->user()->isPremiumClient())
                            <a href="{{ route('subscribe') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                                <x-lucide name="crown" /> View VIP escorts
                            </a>
                        @endif
                        @if (auth()->user()->isSpecialist() && ! auth()->user()->hasActiveListingSubscription())
                            <a href="{{ route('subscribe') }}" class="flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-100">
                                <x-lucide name="crown" /> Subscribe to get listed
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
    <div class="hb-tools">
        <livewire:search.capsule-search />
        <livewire:listings.tier-filter />
    </div>
    <div id="hb-location-pin"></div>
</header>
