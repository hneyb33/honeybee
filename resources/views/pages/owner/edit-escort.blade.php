<x-layouts.app title="Edit service listing - HoneyBee Escorts">
    <section class="px-5 py-10 lg:px-10">
        <div class="mb-8 max-w-3xl">
            <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-gold-400">The Hive</p>
            <h1 class="font-display text-4xl font-semibold md:text-5xl">Edit your service profile</h1>
            <p class="mt-4 text-sm leading-7 text-ivory-50/60">Update your escort profile, rates, availability, and service details for a cleaner client experience.</p>
        </div>

        <form method="POST" action="{{ route('owner.escorts.update', $escort) }}" class="grid gap-8 lg:grid-cols-[1fr_360px]">
            @csrf
            @method('PUT')

            <div class="space-y-6">
                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Profile details</h2>
                        <p class="mt-1 text-sm text-ivory-50/55">Keep your profile up to date with your latest stats, services and availability.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Display name</span>
                            <input name="title" value="{{ old('title', $escort->title) }}" required placeholder="Dohna" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35">
                            @error('title') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Profile tier</span>
                            <select name="tier" required class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                                @foreach (['vip' => 'VIP', 'corporate' => 'Corporate', 'business' => 'Business'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('tier', $escort->tier) === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('tier') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Service category</span>
                            <select name="category" required class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                                @foreach (['escort' => 'Escort', 'companion' => 'Companion', 'model' => 'Model'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('category', $escort->category) === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('category') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Escort stats</h2>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Age</span>
                            <input name="age" type="number" min="18" value="{{ old('age', $escort->age) }}" required class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('age') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Gender</span>
                            <input name="gender" value="{{ old('gender', $escort->gender) }}" required class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('gender') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Nationality</span>
                            <input name="nationality" value="{{ old('nationality', $escort->nationality) }}" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('nationality') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Height</span>
                            <input name="height" value="{{ old('height', $escort->height) }}" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('height') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Weight</span>
                            <input name="weight" value="{{ old('weight', $escort->weight) }}" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('weight') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Hair</span>
                            <input name="hair_color" value="{{ old('hair_color', $escort->hair_color) }}" placeholder="Brunette" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('hair_color') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Build</span>
                            <input name="build" value="{{ old('build', $escort->build) }}" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('build') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Smoking</span>
                            <input name="smoker" value="{{ old('smoker', $escort->smoker) }}" placeholder="No" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('smoker') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Orientation</span>
                            <input name="sexual_orientation" value="{{ old('sexual_orientation', $escort->sexual_orientation) }}" placeholder="Bisexual" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('sexual_orientation') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Availability & contact</h2>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Availability</span>
                            <input name="availability" value="{{ old('availability', $escort->availability) }}" placeholder="Incall, Outcall" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('availability') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Phone / WhatsApp</span>
                            <input name="whatsapp_number" value="{{ old('whatsapp_number', $escort->whatsapp_number) }}" required placeholder="256700000000" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50">
                            @error('whatsapp_number') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                @php
                    $ratesText = old('rates_text');
                    if ($ratesText === null) {
                        $ratesText = '';
                        foreach ($escort->rates ?: [] as $key => $value) {
                            $ratesText .= "{$key}: {$value}\n";
                        }
                        $ratesText = rtrim($ratesText, "\n");
                    }

                    $languagesText = old('languages_text');
                    if ($languagesText === null) {
                        $languagesText = '';
                        foreach ($escort->languages ?: [] as $key => $value) {
                            $languagesText .= "{$key}: {$value}\n";
                        }
                        $languagesText = rtrim($languagesText, "\n");
                    }
                @endphp

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Rates and languages</h2>
                    </div>
                    <div class="grid gap-5">
                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Hourly rate details</span>
                            <textarea name="rates_text" rows="4" placeholder="30 minutes: 100 EUR\n1 hour: 180 EUR" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35">{{ $ratesText }}</textarea>
                            @error('rates_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Languages spoken</span>
                            <textarea name="languages_text" rows="4" placeholder="English: Fluent\nFrench: Conversational" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35">{{ $languagesText }}</textarea>
                            @error('languages_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Service list</h2>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Service offerings (one per line)</span>
                        <textarea name="services_text" rows="5" placeholder="GFE\n69\nFoot fetish" class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35">{{ old('services_text', implode("\n", $escort->services_offered ?: [])) }}</textarea>
                        @error('services_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">About your profile</h2>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">About Me</span>
                        <textarea name="description" rows="8" required class="w-full rounded-xl border border-gold-400/20 bg-ink-950/60 px-4 py-3 text-sm leading-7 text-ivory-50 placeholder:text-ivory-50/35">{{ old('description', $escort->description) }}</textarea>
                        @error('description') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>
            </div>

            <aside class="h-fit rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 lg:sticky lg:top-28">
                <h2 class="font-display text-2xl font-semibold">Save changes</h2>
                <p class="mt-2 text-sm leading-6 text-ivory-50/60">Keep your profile polished and easy for clients to book.</p>
                <div class="my-5 space-y-3 border-y border-gold-400/20 py-5 text-sm text-ivory-50/65">
                    <div class="flex justify-between gap-4"><span>Visibility</span><span class="font-bold text-ivory-50">Active</span></div>
                    <div class="flex justify-between gap-4"><span>Profile</span><span class="font-bold text-ivory-50">{{ $escort->title }}</span></div>
                    <div class="flex justify-between gap-4"><span>Location</span><span class="font-bold text-ivory-50">{{ $escort->neighborhood }}</span></div>
                </div>
                <button type="submit" class="w-full rounded-xl bg-gold-400 py-3.5 text-sm font-extrabold text-ink-950 transition hover:bg-gold-300">
                    Save profile
                </button>
                <a href="{{ route('owner.escorts.index') }}" class="mt-3 flex w-full items-center justify-center rounded-xl border border-gold-400/20 py-3 text-sm font-bold text-ivory-50/70 transition hover:bg-ivory-50/5 hover:text-ivory-50">
                    Back to services
                </a>
            </aside>
        </form>
    </section>
</x-layouts.app>
