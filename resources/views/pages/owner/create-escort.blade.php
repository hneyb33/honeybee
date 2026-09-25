<x-layouts.app title="Create service listing - Honeybee">
    <section class="px-5 py-10 lg:px-10">
        <div class="mb-8 max-w-3xl">
            <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-500">Escort listing studio</p>
            <h1 class="font-display text-4xl font-semibold md:text-5xl">Create your model profile</h1>
            <p class="mt-4 text-sm leading-7 text-ebony-900/65">Share your appearance, special offers, rates, and contact details so clients can book you confidently.</p>
        </div>

        <form method="POST" action="{{ route('owner.escorts.store') }}" enctype="multipart/form-data" class="grid gap-8 lg:grid-cols-[1fr_360px]">
            @csrf

            <div class="space-y-6">
                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-neutral-900 text-2xl font-semibold">Profile basics</h2>
                        <p class="mt-1 text-sm text-condo-400/75">Set the name, category and style of service you want to be discovered for.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Display name</span>
                            <input name="title" value="{{ old('title') }}" required placeholder="Dohna" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('title') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
                        </label>
                        <label class="md:col-span-2">
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Photos and videos</span>
                            <input type="file" name="photos[]" multiple accept="image/*,video/*" class="w-full text-sm">
                        </label>

                        <input type="hidden" name="kind" value="escort">
                        <input type="hidden" name="category" value="escort">
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Listing tier</span>
                            <select name="tier" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                                <option value="premium" @selected(old('tier', 'premium') === 'premium')>Premium</option>
                                <option value="vip" @selected(old('tier') === 'vip')>VIP</option>
                            </select>
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-neutral-900 text-2xl font-semibold">Appearance & profile</h2>
                        <p class="mt-1 text-sm text-condo-400/75">Clients browse by physical details and comfort preferences.</p>
                    </div>

                    <div class="grid gap-5 md:grid-cols-3">
                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Age</span>
                            <input name="age" type="number" min="18" value="{{ old('age') }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('age') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Gender</span>
                            <select name="gender" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                                @foreach (['female' => 'Female', 'male' => 'Male'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('gender') === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('gender') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Nationality</span>
                            <input name="nationality" value="{{ old('nationality') }}" placeholder="Ugandan" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('nationality') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Body type</span>
                            <select name="build" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                                <option value="">Select</option>
                                @foreach (\App\Models\Escort::BODY_TYPES as $type)
                                    <option value="{{ $type }}" @selected(old('build') === $type)>{{ $type }}</option>
                                @endforeach
                            </select>
                            @error('build') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Category</span>
                            <select name="sexual_orientation" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                                @foreach (\App\Models\Escort::ORIENTATIONS as $orientation)
                                    <option value="{{ $orientation }}" @selected(old('sexual_orientation') === $orientation)>{{ ucfirst($orientation) }}</option>
                                @endforeach
                            </select>
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl text-neutral-900 font-semibold">Availability & contact</h2>
                        <p class="mt-1 text-sm text-condo-400/75">How clients can reach you and when you are available.</p>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <div>
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Availability</span>
                            <div class="flex flex-wrap gap-2">
                                @foreach (\App\Models\Escort::AVAILABILITY_OPTIONS as $option)
                                    <label class="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-sm">
                                        <input type="checkbox" name="availability[]" value="{{ $option }}" @checked(in_array($option, old('availability', []), true))>
                                        {{ $option }}
                                    </label>
                                @endforeach
                            </div>
                        </div>

                        <label>
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">WhatsApp number</span>
                            <input name="whatsapp_number" value="{{ old('whatsapp_number') }}" required placeholder="256700000000" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                            @error('whatsapp_number') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
                        </label>
                        <label>
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Telegram</span>
                            <input name="telegram" value="{{ old('telegram') }}" placeholder="username" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                        </label>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Phone</span>
                        <input name="phone" value="{{ old('phone') }}" placeholder="Optional" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                        @error('phone') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl text-neutral-900 font-semibold">Service offerings</h2>
                        <p class="mt-1 text-sm text-condo-400/75">List your top services and packages, one per line.</p>
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                        @foreach (\App\Models\Escort::offeredServices() as $service)
                            <label class="flex items-start gap-3 rounded-xl border border-neutral-200 px-3 py-3 text-sm text-neutral-800">
                                <input type="checkbox" name="services[]" value="{{ $service }}" @checked(in_array($service, old('services', []), true)) class="mt-1">
                                <span>{{ $service }}</span>
                            </label>
                        @endforeach
                    </div>
                    @error('services') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl text-neutral-900 font-semibold">Rates & languages</h2>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="block">
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Price (UGX per hour)</span>
                            <input name="monthly_price" type="number" min="100000" value="{{ old('monthly_price') }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Area</span>
                            <input name="neighborhood" value="{{ old('neighborhood') }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                        </label>
                        <label class="block md:col-span-2">
                            <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">City</span>
                            <input name="city" value="{{ old('city', 'Kampala') }}" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                        </label>

                        <label class="block">
                            <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Languages</span>
                            <textarea name="languages_text" rows="5" placeholder="English: Fluent\nFrench: Conversational" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-900/35">{{ old('languages_text') }}</textarea>
                            @error('languages_text') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                    <div class="mb-6">
                        <h2 class="font-display text-2xl text-neutral-900 font-semibold">About your profile</h2>
                        <p class="mt-1 text-sm text-condo-400/75">Write a polished introduction that helps clients understand your experience and vibe.</p>
                    </div>
                    <label class="block">
                        <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-neutral-500">Profile description</span>
                        <textarea name="description" rows="8" required placeholder="Introduce yourself, your preferred appointments, and what makes the experience special." class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-7 text-neutral-900 placeholder:text-neutral-900/35">{{ old('description') }}</textarea>
                        @error('description') <span class="mt-2 block text-xs font-bold text-red-300">{{ $message }}</span> @enderror
                    </label>
                </section>
            </div>

            <aside class="h-fit rounded-2xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-28">
                <h2 class="text-2xl font-semibold text-neutral-900">Submit for review</h2>
                <p class="mt-2 text-sm leading-6 text-neutral-600">The profile stays hidden until an admin verifies it and your specialist subscription is active.</p>
                <div class="my-5 space-y-3 border-y border-neutral-200 py-5 text-sm text-neutral-600">
                    <div class="flex justify-between gap-4"><span>Visibility</span><span class="font-semibold text-neutral-900">After approval</span></div>
                    <div class="flex justify-between gap-4"><span>Contact</span><span class="font-semibold text-neutral-900">WhatsApp / Telegram</span></div>
                    <div class="flex justify-between gap-4"><span>Photos</span><span class="font-semibold text-neutral-900">At least 3</span></div>
                </div>
                <button type="submit" class="w-full rounded-lg bg-neutral-900 py-3.5 text-sm font-semibold text-white">
                    Submit for review
                </button>
                <a href="{{ route('owner.escorts.index') }}" class="mt-3 flex w-full items-center justify-center rounded-xl border border-neutral-200 py-3 text-sm font-bold text-neutral-500/35 transition hover:bg-neutral-900/15 hover:text-neutral-900">
                    Back to the hive
                </a>
            </aside>
        </form>
    </section>
</x-layouts.app>
