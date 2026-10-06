@php
    $showBooking = $showBooking ?? true;
    $embedded = $embedded ?? false;
@endphp

@unless ($embedded)
<div class="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
    <div>
        <div class="mb-2 flex items-center gap-2">
            <span class="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white">{{ $escort->tag() }}</span>
            @if ($escort->serviceLabel())
                <span class="text-sm text-neutral-500">{{ $escort->serviceLabel() }}</span>
            @endif
        </div>
        @if ($showBooking)
            <h1 class="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{{ $escort->title }}</h1>
        @else
            <h2 class="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{{ $escort->title }}</h2>
        @endif
        <p class="mt-2 flex items-center gap-1 text-sm text-neutral-600"><x-lucide name="map-pin" /> {{ $escort->neighborhood }}, {{ $escort->city }}@if ($escort->nationality) · {{ $escort->nationality }}@endif · {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1).' · '.$escort->review_count.' reviews' : 'New' }}</p>
    </div>
    @if ($showBooking)
        <div class="flex gap-2 text-sm font-medium" x-data="{ copied: false }">
            <button type="button" class="inline-flex items-center gap-1 rounded-lg px-3 py-2 underline" @click="navigator.clipboard.writeText(window.location.href); copied = true">
                <x-lucide name="share" />
                <span x-show="!copied">Share</span>
                <span x-show="copied">Link copied</span>
            </button>
            <livewire:escort.favorite-toggle :escort="$escort" :inline="true" />
        </div>
    @endif
</div>
@endunless

<x-photo-grid :escort="$escort" />

@if ($video = $escort->profileVideo())
    <video class="mt-4 w-full rounded-xl bg-black" controls playsinline src="{{ $video->url() }}"></video>
@endif

<div class="mt-6 sm:mt-8">
    <div>
        <div class="mb-8 border-b border-neutral-200 pb-8">
            <h3 class="text-2xl font-semibold text-neutral-900">{{ $escort->tag() }} profile hosted by {{ $escort->owner?->name ?? 'Honeybee' }}</h3>
            @if ($escort->kind === 'service')
                <p class="mt-2 text-sm text-neutral-600">
                    {{ $escort->occupation ?: $escort->serviceLabel() }}
                    @if ($escort->experienceLabel())
                        · {{ $escort->experienceLabel() }}
                    @endif
                    @if ($escort->travel_km)
                        · {{ $escort->travel_km === 'anywhere' ? 'Travels anywhere' : 'Travels up to '.$escort->travel_km.' km' }}
                    @endif
                </p>
                <div class="mt-3 flex flex-wrap gap-2 text-sm">
                    @if ($escort->isVerified())
                        <span class="rounded-full bg-[#f4f5f6] px-3 py-1">Identity verified</span>
                    @endif
                    @if ($escort->references->contains('status', 'confirmed'))
                        <span class="rounded-full bg-[#f4f5f6] px-3 py-1">Reference confirmed</span>
                    @endif
                    @if ($escort->has_certificate)
                        <span class="rounded-full bg-[#f4f5f6] px-3 py-1">Training certificate</span>
                    @endif
                </div>
                @if ($escort->learningLabels())
                    <p class="mt-3 text-sm text-[#767f88]">{{ implode(' · ', $escort->learningLabels()) }}</p>
                @endif
            @else
                <p class="mt-2 text-sm text-neutral-600">{{ $escort->age }} yrs · {{ ucfirst((string) $escort->gender) }}@if ($escort->build) · {{ $escort->build }}@endif · {{ $escort->availability }}</p>
            @endif
            @if ($escort->spokenLanguages())
                <p class="mt-2 text-sm text-[#767f88]">{{ implode(', ', $escort->spokenLanguages()) }}</p>
            @endif
        </div>
        <section class="border-b border-neutral-200 pb-8">
            <h3 class="mb-3 text-xl font-semibold">About</h3>
            <div class="max-w-2xl" x-data="{ open: false, long: false }" x-init="long = $refs.copy.scrollHeight > 150">
                <div class="relative">
                    <p x-ref="copy" class="leading-7 text-[#222]" :class="open ? '' : 'max-h-36 overflow-hidden'">{{ $escort->description }}</p>
                    <div x-show="long && ! open" x-cloak class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent backdrop-blur-[1px]"></div>
                </div>
                <button type="button" x-show="long" x-cloak class="mt-3 font-semibold underline" @click="open = ! open">
                    <span x-show="! open">Read more</span>
                    <span x-show="open">Show less</span>
                </button>
            </div>
        </section>
        <section class="border-b border-neutral-200 py-8">
            @php
                $profileReviews = $escort->relationLoaded('reviews')
                    ? $escort->reviews
                    : $escort->reviews()->with('client')->latest()->take(8)->get();
            @endphp
            <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-xl font-semibold">★ {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1) : 'New' }} · {{ $escort->review_count }} {{ \Illuminate\Support\Str::plural('review', $escort->review_count) }}</h3>
                @if (! auth()->check() || auth()->user()->isClient())
                    <a href="{{ route('escorts.review', $escort) }}" class="text-sm font-semibold underline">Write a review</a>
                @endif
            </div>
            @if ($profileReviews->isEmpty())
                <p class="text-sm text-[#6a6a6a]">No reviews yet.</p>
            @else
                <div class="grid gap-6 sm:grid-cols-2">
                    @foreach ($profileReviews as $review)
                        <article>
                            <p class="font-medium text-[#222]">{{ $review->client?->name ?? 'Client' }}</p>
                            <p class="text-sm text-[#FF385C]">{{ str_repeat('★', (int) $review->rating) }}<span class="text-[#dddddd]">{{ str_repeat('★', 5 - (int) $review->rating) }}</span></p>
                            @if ($review->body)
                                <p class="mt-2 text-sm leading-6 text-[#222]">{{ $review->body }}</p>
                            @endif
                        </article>
                    @endforeach
                </div>
            @endif
        </section>
        @if ($escort->kind === 'service' && $escort->offerings->isNotEmpty())
            <section class="border-b border-neutral-200 py-8">
                <h3 class="mb-4 text-xl font-semibold">Services</h3>
                <div class="space-y-6">
                    @foreach ($escort->offerings->groupBy('group_name') as $group => $items)
                        <div>
                            <h4 class="text-sm font-semibold text-neutral-500">{{ $group }}</h4>
                            <div class="mt-3 grid gap-3 sm:grid-cols-2">
                                @foreach ($items as $service)
                                    <div class="rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800">
                                        <p class="font-medium">{{ $service->name }}</p>
                                        <p class="mt-1 text-neutral-600">{{ $service->priceLabel() }}</p>
                                        <p class="text-neutral-500">{{ $service->locationLabel() }}@if ($service->turnaround) · {{ $service->turnaround }}@endif</p>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </section>
        @elseif ($escort->services_offered)
            <section class="py-8">
                <h3 class="mb-4 text-xl font-semibold">What is offered</h3>
                <div class="grid gap-3 sm:grid-cols-2">
                    @foreach (collect($escort->services_offered)->take(8) as $service)
                        <div class="rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800">{{ $service }}</div>
                    @endforeach
                </div>
            </section>
        @endif
        @if ($escort->kind === 'service' && collect($escort->availabilityLines())->contains(fn ($day) => $day['on']))
            <section class="py-8">
                <h3 class="mb-4 text-xl font-semibold">Availability</h3>
                <div class="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                    @foreach ($escort->availabilityLines() as $day)
                        <div class="flex items-center justify-between px-4 py-3 text-sm">
                            <span>{{ $day['label'] }}</span>
                            <span class="text-neutral-600">{{ $day['on'] ? $day['from'].' – '.$day['to'] : 'Off' }}</span>
                        </div>
                    @endforeach
                </div>
            </section>
        @endif
    </div>
</div>

@if ($showBooking)
    @php
        $stickyCategory = $escort->kind === 'service'
            ? ($escort->serviceLabel() ?: 'Service')
            : trim($escort->tag().' · '.($escort->sexual_orientation === 'bi-sexual' ? 'Bi-sexual' : ucfirst((string) $escort->sexual_orientation)));
    @endphp
    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-[#dddddd] bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div class="min-w-0">
                <p class="truncate text-sm text-[#222]"><span class="text-base font-semibold">{{ $escort->price_label }}</span> / hour</p>
                <p class="truncate text-sm text-[#6a6a6a]">{{ $escort->neighborhood }}, {{ $escort->city }} · {{ $stickyCategory }}</p>
            </div>
            <div class="relative shrink-0" x-data="{ chat: false }">
                @if ($escort->whatsappUrl() && $escort->telegramUrl())
                    <button type="button" @click="chat = ! chat" class="hb-chat px-5 py-3 text-sm font-semibold">Chat</button>
                    <div x-show="chat" x-cloak @click.outside="chat = false" class="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-xl border border-[#dddddd] bg-white text-sm shadow-xl">
                        <a href="{{ route('escorts.contact', [$escort, 'whatsapp']) }}" class="block px-4 py-3 font-medium hover:bg-neutral-50">WhatsApp</a>
                        <a href="{{ route('escorts.contact', [$escort, 'telegram']) }}" class="block border-t border-[#dddddd] px-4 py-3 font-medium hover:bg-neutral-50">Telegram</a>
                    </div>
                @elseif ($escort->whatsappUrl())
                    <a href="{{ route('escorts.contact', [$escort, 'whatsapp']) }}" class="hb-chat inline-flex px-5 py-3 text-sm font-semibold">WhatsApp</a>
                @elseif ($escort->telegramUrl())
                    <a href="{{ route('escorts.contact', [$escort, 'telegram']) }}" class="hb-chat inline-flex px-5 py-3 text-sm font-semibold">Telegram</a>
                @endif
            </div>
        </div>
    </div>
@endif
