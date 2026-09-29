@php
    use App\Support\HomeServiceCatalog;
    $profile = $profile ?? $escort;
    $saved = is_array($saved ?? null) ? $saved : [];
    $savedHours = old('hours', $saved['hours'] ?? $profile->weekly_hours ?? []);
@endphp

<h2 class="text-sm font-semibold text-neutral-900">Which days can you work?</h2>
<p class="text-xs text-neutral-500">Turn a day on, then set the hours. Turn it off when you are not available.</p>
@error('hours') <p class="text-xs font-bold text-red-600">{{ $message }}</p> @enderror
<div class="space-y-2">
    @foreach (HomeServiceCatalog::DAYS as $key => $label)
        @php
            $day = $savedHours[$key] ?? [];
            $on = filter_var(old('hours.'.$key.'.on', $day['on'] ?? false), FILTER_VALIDATE_BOOLEAN);
            $from = old('hours.'.$key.'.from', $day['from'] ?? '08:00');
            $to = old('hours.'.$key.'.to', $day['to'] ?? '17:00');
        @endphp
        <div class="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-300 px-4 py-3" x-data="{ on: {{ $on ? 'true' : 'false' }} }">
            <label class="flex min-w-36 items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="hours[{{ $key }}][on]" value="1" x-model="on" @checked($on)>
                {{ $label }}
            </label>
            <label class="text-xs text-neutral-500">From
                <input type="time" name="hours[{{ $key }}][from]" value="{{ $from }}" class="ml-1 rounded-lg border border-neutral-300 px-2 py-1 text-sm" :disabled="!on">
            </label>
            <label class="text-xs text-neutral-500">To
                <input type="time" name="hours[{{ $key }}][to]" value="{{ $to }}" class="ml-1 rounded-lg border border-neutral-300 px-2 py-1 text-sm" :disabled="!on">
            </label>
            @error('hours.'.$key.'.from') <span class="text-xs font-bold text-red-600">{{ $message }}</span> @enderror
            @error('hours.'.$key.'.to') <span class="text-xs font-bold text-red-600">{{ $message }}</span> @enderror
        </div>
    @endforeach
</div>
