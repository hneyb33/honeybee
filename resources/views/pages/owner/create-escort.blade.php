<x-layouts.app title="Create service listing - HoneyBee Escorts">
    <section class="px-5 py-10 lg:px-10">
        <div class="mb-8 max-w-3xl">
            <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-gold-400">Escort listing studio</p>
            <h1 class="font-display text-4xl font-semibold md:text-5xl">Create your service profile</h1>
            <p class="mt-4 text-sm leading-7 text-ebony-900/65">Share your appearance, special offers, rates, and contact details so clients can book you confidently.</p>
        </div>

        <form method="POST" action="{{ route('owner.escorts.store') }}" class="grid gap-8 lg:grid-cols-[1fr_360px]">
            @csrf

            <div class="space-y-6">
                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Profile basics</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">Set the name, category and style of service you want to be discovered for.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Profile name</span>
                            <input name="title" value="{{ old('title') }}" required placeholder="Dohna" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-ink-950/35">
                            @error('title') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Profile tier</span>
                            <select name="tier" required class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                                @foreach (['vip' => 'VIP', 'corporate' => 'Corporate', 'business' => 'Business'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('tier') === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('tier') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Service category</span>
                            <select name="category" required class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                                @foreach (['escort' => 'Escort', 'companion' => 'Companion', 'model' => 'Model'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('category') === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('category') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Appearance & profile</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">Clients browse by physical details and comfort preferences.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Age</span>
                            <input name="age" type="number" min="18" value="{{ old('age') }}" required class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('age') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Gender</span>
                            <input name="gender" value="{{ old('gender') }}" required class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('gender') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Nationality</span>
                            <input name="nationality" value="{{ old('nationality') }}" placeholder="Ugandan" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('nationality') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Height</span>
                            <input name="height" value="{{ old('height') }}" placeholder="170 cm" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('height') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Weight</span>
                            <input name="weight" value="{{ old('weight') }}" placeholder="55 kg" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('weight') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Bust / body</span>
                            <input name="bust_size" value="{{ old('bust_size') }}" placeholder="34C / Slim" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('bust_size') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Hair color</span>
                            <input name="hair_color" value="{{ old('hair_color') }}" placeholder="Brunette" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('hair_color') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Hair length</span>
                            <input name="hair_length" value="{{ old('hair_length') }}" placeholder="Long" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('hair_length') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Build</span>
                            <input name="build" value="{{ old('build') }}" placeholder="Athletic" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('build') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Availability & contact</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">How clients can reach you and when you are available.</p>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Availability</span>
                            <input name="availability" value="{{ old('availability', 'Incall, Outcall') }}" placeholder="Incall, Outcall" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                            @error('availability') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">WhatsApp number</span>
                            <input name="whatsapp_number" value="{{ old('whatsapp_number') }}" required placeholder="256700000000" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-ink-950/35">
                            @error('whatsapp_number') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Phone</span>
                        <input name="phone" value="{{ old('phone') }}" placeholder="Optional" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950">
                        @error('phone') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Service offerings</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">List your top services and packages, one per line.</p>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Services</span>
                        <textarea name="services_text" rows="5" placeholder="GFE\n69\nMassage" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-ink-950/35">{{ old('services_text') }}</textarea>
                        @error('services_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Rates & languages</h2>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Rate details</span>
                            <textarea name="rates_text" rows="5" placeholder="30 minutes: 100 EUR\n1 hour: 180 EUR" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-ink-950/35">{{ old('rates_text') }}</textarea>
                            @error('rates_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Languages</span>
                            <textarea name="languages_text" rows="5" placeholder="English: Fluent\nFrench: Conversational" class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-ink-950/35">{{ old('languages_text') }}</textarea>
                            @error('languages_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">About your profile</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">Write a polished introduction that helps clients understand your experience and vibe.</p>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gold-400">Profile description</span>
                        <textarea name="description" rows="8" required placeholder="Introduce yourself, your preferred appointments, and what makes the experience special." class="w-full rounded-xl border border-gold-400/20 bg-ivory-50 px-4 py-3 text-sm leading-7 text-ink-950 placeholder:text-ink-950/35">{{ old('description') }}</textarea>
                        @error('description') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>
            </div>

            <aside class="h-fit rounded-2xl border border-gold-400/20 bg-ebony-850 p-5 lg:sticky lg:top-28">
                <h2 class="font-display text-2xl font-semibold">Publish service</h2>
                <p class="mt-2 text-sm leading-6 text-ebony-900/65">Your profile will be visible to booking clients after you publish.</p>
                <div class="my-5 space-y-3 border-y border-gold-400/20 py-5 text-sm text-ebony-900/70">
                    <div class="flex justify-between gap-4"><span>Visibility</span><span class="font-bold text-ink-950">Active</span></div>
                    <div class="flex justify-between gap-4"><span>Contact channel</span><span class="font-bold text-ink-950">WhatsApp</span></div>
                    <div class="flex justify-between gap-4"><span>Brought by</span><span class="font-bold text-ink-950">{{ auth()->user()->name }}</span></div>
                </div>
                <button type="submit" class="w-full rounded-xl bg-gold-400 py-3.5 text-sm font-extrabold text-ink-950 transition hover:bg-gold-300">
                    Publish profile
                </button>
                <a href="{{ route('owner.escorts.index') }}" class="mt-3 flex w-full items-center justify-center rounded-xl border border-gold-400/20 py-3 text-sm font-bold text-ebony-900/75 transition hover:bg-gold-300/15 hover:text-ink-950">
                    Back to the hive
                </a>
            </aside>
        </form>
    </section>
</x-layouts.app>
