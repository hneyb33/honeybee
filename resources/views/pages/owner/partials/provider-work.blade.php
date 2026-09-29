@php
    use App\Support\HomeServiceCatalog;
    $profile = $profile ?? $escort;
    $saved = is_array($saved ?? null) ? $saved : [];
    $occupation = old('service_type', $saved['service_type'] ?? $profile->service_type ?? 'private_chef');
    $existing = $profile->offerings->keyBy('service_key');
    $customRows = $profile->service_type === 'other' ? $profile->offerings->values() : collect();
@endphp

<fieldset>
    <legend class="text-sm font-semibold text-neutral-900">What service do you provide?</legend>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
        @foreach (HomeServiceCatalog::OCCUPATIONS as $value => $label)
            <label class="cursor-pointer rounded-xl border border-neutral-300 px-4 py-4 has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
                <input type="radio" name="service_type" value="{{ $value }}" class="sr-only" x-model="occupation" @checked($occupation === $value) required>
                <span class="block font-semibold">{{ $label }}</span>
                @if ($value === 'home_laundry')
                    <span class="mt-1 block text-xs text-neutral-500">Laundry</span>
                @elseif ($value === 'other')
                    <span class="mt-1 block text-xs text-neutral-500">Type your own occupation</span>
                @endif
            </label>
        @endforeach
    </div>
</fieldset>

<label class="block text-sm" x-show="occupation === 'other'" x-cloak>
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Occupation</span>
    <input name="other_occupation" value="{{ old('other_occupation', $profile->service_type === 'other' ? $profile->occupation : '') }}" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm" placeholder="Gardener">
    @error('other_occupation') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
</label>

@error('offerings') <p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{{ $message }}</p> @enderror

@foreach (['private_chef', 'private_massage', 'home_laundry'] as $type)
    <div x-show="occupation === '{{ $type }}'" x-cloak class="space-y-6">
        @if ($type === 'private_massage')
            <p class="text-sm text-neutral-600">These are wellness sessions. Prenatal and postnatal massage are for qualified providers only.</p>
        @endif
        @foreach (collect(HomeServiceCatalog::items($type))->groupBy('group') as $group => $items)
            <section>
                <h3 class="text-sm font-semibold text-neutral-900">{{ $group }}</h3>
                <div class="mt-3 space-y-3">
                    @foreach ($items as $item)
                        @php
                            $key = $item['key'];
                            $row = $existing->get($key);
                            $checked = (bool) old('offerings.'.$key.'.selected', $row !== null);
                            $unit = old('offerings.'.$key.'.unit', $row->pricing_unit ?? array_key_first(HomeServiceCatalog::units($type)));
                            $location = old('offerings.'.$key.'.location', $row->service_location ?? 'client_home');
                        @endphp
                        <div class="rounded-xl border border-neutral-200 p-3" x-data="{ on: {{ $checked ? 'true' : 'false' }} }">
                            <label class="flex cursor-pointer items-start gap-3">
                                <input type="checkbox" name="offerings[{{ $key }}][selected]" value="1" class="mt-1" x-model="on" @checked($checked)>
                                <span>
                                    <span class="block text-sm font-medium">{{ $item['name'] }}</span>
                                    @if ($item['note'])
                                        <span class="block text-xs text-neutral-500">{{ $item['note'] }}</span>
                                    @endif
                                </span>
                            </label>
                            <div class="mt-3 grid gap-3 sm:grid-cols-2" x-show="on" x-cloak>
                                <label class="text-xs text-neutral-500">Price (UGX)
                                    <input name="offerings[{{ $key }}][price]" type="number" min="0" value="{{ old('offerings.'.$key.'.price', $row->price ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                                </label>
                                <label class="text-xs text-neutral-500">Pricing unit
                                    <select name="offerings[{{ $key }}][unit]" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                                        @foreach (HomeServiceCatalog::units($type) as $value => $label)
                                            <option value="{{ $value }}" @selected($unit === $value)>{{ $label }}</option>
                                        @endforeach
                                    </select>
                                </label>
                                <label class="text-xs text-neutral-500">Where
                                    <select name="offerings[{{ $key }}][location]" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                                        @foreach (HomeServiceCatalog::LOCATIONS as $value => $label)
                                            <option value="{{ $value }}" @selected($location === $value)>{{ $label }}</option>
                                        @endforeach
                                    </select>
                                </label>
                                <label class="text-xs text-neutral-500">{{ HomeServiceCatalog::turnaroundLabel($type) }}
                                    <input name="offerings[{{ $key }}][turnaround]" value="{{ old('offerings.'.$key.'.turnaround', $row->turnaround ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="{{ $type === 'home_laundry' ? 'Same day' : 'Optional' }}">
                                </label>
                                @error('offerings.'.$key.'.price') <span class="text-xs font-bold text-red-600 sm:col-span-2">{{ $message }}</span> @enderror
                            </div>
                        </div>
                    @endforeach
                </div>
            </section>
        @endforeach
    </div>
@endforeach

<div x-show="occupation === 'other'" x-cloak class="space-y-3">
    <p class="text-sm text-neutral-600">Add each service with its price. A chef uses per session, per person, or per day. Laundry can use per kilogram, item, load, or package.</p>
    @for ($i = 0; $i < max(4, $customRows->count()); $i++)
        @php $custom = $customRows[$i] ?? null; @endphp
        <div class="grid gap-3 rounded-xl border border-neutral-200 p-3 sm:grid-cols-2">
            <label class="text-xs text-neutral-500 sm:col-span-2">Service
                <input name="custom[{{ $i }}][name]" value="{{ old('custom.'.$i.'.name', $custom->name ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            </label>
            <label class="text-xs text-neutral-500">Price (UGX)
                <input name="custom[{{ $i }}][price]" type="number" min="0" value="{{ old('custom.'.$i.'.price', $custom->price ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            </label>
            <label class="text-xs text-neutral-500">Pricing unit
                <select name="custom[{{ $i }}][unit]" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                    @foreach (HomeServiceCatalog::units('other') as $value => $label)
                        <option value="{{ $value }}" @selected(old('custom.'.$i.'.unit', $custom->pricing_unit ?? 'session') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </label>
            <label class="text-xs text-neutral-500">Where
                <select name="custom[{{ $i }}][location]" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                    @foreach (HomeServiceCatalog::LOCATIONS as $value => $label)
                        <option value="{{ $value }}" @selected(old('custom.'.$i.'.location', $custom->service_location ?? 'client_home') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </label>
            <label class="text-xs text-neutral-500">How long
                <input name="custom[{{ $i }}][turnaround]" value="{{ old('custom.'.$i.'.turnaround', $custom->turnaround ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            </label>
        </div>
    @endfor
</div>
