<x-layouts.app :title="$escort->title.' - Honeybee'">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        @if (session('status'))
            <p class="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif

        <div class="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
                <div class="mb-2 flex items-center gap-2">
                    <span class="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white">{{ $escort->tag() }}</span>
                    @if ($escort->serviceLabel())
                        <span class="text-sm text-neutral-500">{{ $escort->serviceLabel() }}</span>
                    @endif
                </div>
                <h1 class="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{{ $escort->title }}</h1>
                <p class="mt-2 flex items-center gap-1 text-sm text-neutral-600"><x-lucide name="map-pin" /> {{ $escort->neighborhood }}, {{ $escort->city }}@if ($escort->nationality) · {{ $escort->nationality }}@endif · {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1).' · '.$escort->review_count.' reviews' : 'New' }}</p>
            </div>
            <div class="flex gap-2 text-sm font-medium" x-data="{ copied: false }">
                <button type="button" class="inline-flex items-center gap-1 rounded-lg px-3 py-2 underline" @click="navigator.clipboard.writeText(window.location.href); copied = true">
                    <x-lucide name="share" />
                    <span x-show="!copied">Share</span>
                    <span x-show="copied">Link copied</span>
                </button>
                <livewire:escort.favorite-toggle :escort="$escort" :inline="true" />
            </div>
        </div>

        <x-photo-grid :escort="$escort" />

        @if ($video = $escort->profileVideo())
            <video class="mt-4 w-full rounded-xl bg-black" controls playsinline src="{{ $video->url() }}"></video>
        @endif

        <div class="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[1.6fr_0.9fr] lg:gap-12">
            <div>
                <div class="mb-8 border-b border-neutral-200 pb-8">
                    <h2 class="text-2xl font-semibold text-neutral-900">{{ $escort->tag() }} profile hosted by {{ $escort->owner?->name ?? 'Honeybee' }}</h2>
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
                        <p class="mt-2 text-sm text-neutral-600">{{ $escort->age }} yrs · {{ ucfirst($escort->gender) }}@if ($escort->build) · {{ $escort->build }}@endif · {{ $escort->availability }}</p>
                    @endif
                    @if ($escort->spokenLanguages())
                        <p class="mt-2 text-sm text-[#767f88]">{{ implode(', ', $escort->spokenLanguages()) }}</p>
                    @endif
                    <div class="mt-4 flex flex-wrap gap-3">
                        @if ($escort->whatsappUrl())
                            <a href="{{ $escort->whatsappUrl() }}" class="inline-flex items-center gap-2 rounded-lg bg-[#0f0a0a] px-4 py-2 text-sm font-semibold text-white" target="_blank" rel="noopener"><x-lucide name="message" /> WhatsApp {{ $escort->whatsappLabel() }}</a>
                        @endif
                        @if ($escort->telegramUrl())
                            <a href="{{ $escort->telegramUrl() }}" class="rounded-lg border border-[#767f88] px-4 py-2 text-sm font-semibold text-[#0f0a0a]" target="_blank" rel="noopener">Telegram {{ $escort->telegramLabel() }}</a>
                        @endif
                    </div>
                </div>
                <section class="border-b border-neutral-200 pb-8">
                    <h2 class="mb-3 text-xl font-semibold">About</h2>
                    <p class="max-w-2xl leading-7 text-neutral-700">{{ $escort->description }}</p>
                </section>
                @if ($escort->kind === 'service' && $escort->offerings->isNotEmpty())
                    <section class="border-b border-neutral-200 py-8">
                        <h2 class="mb-4 text-xl font-semibold">Services</h2>
                        <div class="space-y-6">
                            @foreach ($escort->offerings->groupBy('group_name') as $group => $items)
                                <div>
                                    <h3 class="text-sm font-semibold text-neutral-500">{{ $group }}</h3>
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
                        <h2 class="mb-4 text-xl font-semibold">What is offered</h2>
                        <div class="grid gap-3 sm:grid-cols-2">
                            @foreach (collect($escort->services_offered)->take(8) as $service)
                                <div class="rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800">{{ $service }}</div>
                            @endforeach
                        </div>
                    </section>
                @endif
                @if ($escort->kind === 'service' && collect($escort->availabilityLines())->contains(fn ($day) => $day['on']))
                    <section class="py-8">
                        <h2 class="mb-4 text-xl font-semibold">Availability</h2>
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
            <livewire:escort.booking-dock :escort="$escort" />
        </div>
    </div>
</x-layouts.app>
