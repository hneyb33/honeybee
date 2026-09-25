<x-layouts.app title="Edit service listing - Honeybee">
    <section class="px-5 py-10 lg:px-10">
        <div class="mb-8 max-w-3xl">
            <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-500">The Hive</p>
            <h1 class="font-display text-4xl font-semibold md:text-5xl">Edit your service profile</h1>
            <p class="mt-4 text-sm leading-7 text-ebony-900/65">Update your escort profile, rates, availability, and service details for a cleaner client experience.</p>
        </div>

        <form method="POST" action="{{ route('owner.escorts.update', $escort) }}" enctype="multipart/form-data" class="grid gap-8 lg:grid-cols-[1fr_360px]">
            @csrf
            @method('PUT')

            <div class="space-y-6">
                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Profile details</h2>
                        <p class="mt-1 text-sm text-ebony-900/65">Keep your profile up to date with your latest stats, services and availability.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Display name</span>
                            <input name="title" value="{{ old('title', $escort->title) }}" required placeholder="Dohna" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-900/35">
                            @error('title') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Profile tier</span>
                            <select name="kind" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                                <option value="escort" @selected(old('kind', $escort->kind) === 'escort')>Escort</option>
                                <option value="service" @selected(old('kind', $escort->kind) === 'service')>Service</option>
                            </select>
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Tier</span>
                            <select name="tier" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                                <option value="premium" @selected(old('tier', $escort->escort_tier) === 'premium')>Premium</option>
                                <option value="vip" @selected(old('tier', $escort->escort_tier) === 'vip')>VIP</option>
                            </select>
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Service type</span>
                            <select name="service_type" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                                <option value="">Not a service</option>
                                @foreach (['private_chef' => 'Private chef', 'home_laundry' => 'Home laundry', 'private_massage' => 'Private massage'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('service_type', $escort->service_type) === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Category</span>
                            <select name="category" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                                <option value="escort" @selected(old('category', $escort->category) === 'escort')>Escort</option>
                                <option value="service" @selected(old('category', $escort->category) === 'service')>Service</option>
                            </select>
                            @error('category') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Escort stats</h2>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Age</span>
                            <input name="age" type="number" min="18" value="{{ old('age', $escort->age) }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('age') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Gender</span>
                            <input name="gender" value="{{ old('gender', $escort->gender) }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('gender') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Nationality</span>
                            <input name="nationality" value="{{ old('nationality', $escort->nationality) }}" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('nationality') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Height</span>
                            <input name="height" value="{{ old('height', $escort->height) }}" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('height') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Weight</span>
                            <input name="weight" value="{{ old('weight', $escort->weight) }}" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('weight') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Body type</span>
                            <select name="build" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                                @foreach (\App\Models\Escort::BODY_TYPES as $type)
                                    <option value="{{ $type }}" @selected(old('build', $escort->build) === $type)>{{ $type }}</option>
                                @endforeach
                            </select>
                            @error('build') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Smoking</span>
                            <input name="smoker" value="{{ old('smoker', $escort->smoker) }}" placeholder="No" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('smoker') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Orientation</span>
                            <input name="sexual_orientation" value="{{ old('sexual_orientation', $escort->sexual_orientation) }}" placeholder="Bisexual" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('sexual_orientation') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Availability & contact</h2>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Availability</span>
                        <div>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Availability</span>
                            <div class="flex flex-wrap gap-2">
                                @foreach (\App\Models\Escort::AVAILABILITY_OPTIONS as $option)
                                    <label class="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-sm">
                                        <input type="checkbox" name="availability[]" value="{{ $option }}" @checked(in_array($option, old('availability', array_map('trim', explode(',', (string) $escort->availability))), true))>
                                        {{ $option }}
                                    </label>
                                @endforeach
                            </div>
                        </div>
                            @error('availability') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Phone / WhatsApp</span>
                            <input name="whatsapp_number" value="{{ old('whatsapp_number', $escort->whatsapp_number) }}" required placeholder="256700000000" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Telegram</span>
                            <input name="telegram" value="{{ old('telegram', $escort->telegram) }}" placeholder="username" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
                        </label>
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Add photos or videos</span>
                            <input type="file" name="photos[]" multiple accept="image/*,video/*" class="w-full text-sm">
                            @error('photos') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
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

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Rates and languages</h2>
                    </div>
                    <div class="grid gap-5">
                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Hourly rate details</span>
                            <textarea name="rates_text" rows="4" placeholder="30 minutes: 100 EUR\n1 hour: 180 EUR" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-900/35">{{ $ratesText }}</textarea>
                            @error('rates_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Languages spoken</span>
                            <textarea name="languages_text" rows="4" placeholder="English: Fluent\nFrench: Conversational" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-900/35">{{ $languagesText }}</textarea>
                            @error('languages_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">Service list</h2>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Service offerings (one per line)</span>
                        <textarea name="services_text" rows="5" placeholder="GFE\n69\nFoot fetish" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-900/35">{{ old('services_text', implode("\n", $escort->services_offered ?: [])) }}</textarea>
                        @error('services_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl font-semibold">About your profile</h2>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">About Me</span>
                        <textarea name="description" rows="8" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-7 text-neutral-900 placeholder:text-neutral-900/35">{{ old('description', $escort->description) }}</textarea>
                        @error('description') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>
            </div>

            <aside class="h-fit rounded-2xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-28">
                <h2 class="font-display text-2xl font-semibold">Save changes</h2>
                <p class="mt-2 text-sm leading-6 text-ebony-900/65">Keep your profile polished and easy for clients to book.</p>
                <div class="my-5 space-y-3 border-y border-neutral-200 py-5 text-sm text-ebony-900/70">
                    <div class="flex justify-between gap-4"><span>Visibility</span><span class="font-bold text-neutral-900">Active</span></div>
                    <div class="flex justify-between gap-4"><span>Profile</span><span class="font-bold text-neutral-900">{{ $escort->title }}</span></div>
                    <div class="flex justify-between gap-4"><span>Location</span><span class="font-bold text-neutral-900">{{ $escort->neighborhood }}</span></div>
                </div>
                <button type="submit" class="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-900">
                    Save profile
                </button>
                <a href="{{ route('owner.escorts.index') }}" class="mt-3 flex w-full items-center justify-center rounded-xl border border-neutral-200 py-3 text-sm font-bold text-ebony-900/75 transition hover:bg-neutral-900/15 hover:text-neutral-900">
                    Back to services
                </a>
            </aside>
        </form>
    </section>
</x-layouts.app>
