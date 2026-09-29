@php
    use App\Support\HomeServiceCatalog;
    $profile = $profile ?? $escort;
    $saved = is_array($saved ?? null) ? $saved : [];
    $band = old('experience_band', $saved['experience_band'] ?? $profile->experience_band);
    $learning = old('learning', $saved['learning'] ?? $profile->learning_methods ?? []);
    $question = 'How long have you done this work? '.implode('. ', HomeServiceCatalog::EXPERIENCE);
@endphp

<div class="flex items-center justify-between gap-3">
    <h2 class="text-sm font-semibold text-neutral-900">How long have you done this work?</h2>
    <button type="button" class="rounded-full border border-neutral-300 px-3 py-1 text-sm" @click="speak(@js($question))" aria-label="Read this question aloud">Speak</button>
</div>
<div class="grid gap-2">
    @foreach (HomeServiceCatalog::EXPERIENCE as $value => $label)
        <label class="cursor-pointer rounded-xl border border-neutral-300 px-4 py-4 text-sm has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
            <input type="radio" name="experience_band" value="{{ $value }}" class="sr-only" @checked($band === $value) required>
            {{ $label }}
        </label>
    @endforeach
</div>
@error('experience_band') <p class="text-xs font-bold text-red-600">{{ $message }}</p> @enderror

<div class="flex items-center justify-between gap-3">
    <h2 class="text-sm font-semibold text-neutral-900">How did you learn this work?</h2>
    <button type="button" class="rounded-full border border-neutral-300 px-3 py-1 text-sm" @click="speak(@js('How did you learn this work? '.implode('. ', HomeServiceCatalog::LEARNING)))" aria-label="Read this question aloud">Speak</button>
</div>
<p class="text-xs text-neutral-500">Select all that apply. Practical experience counts.</p>
<div class="grid gap-2">
    @foreach (HomeServiceCatalog::LEARNING as $value => $label)
        <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-300 px-4 py-3 text-sm has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
            <input type="checkbox" name="learning[]" value="{{ $value }}" @checked(in_array($value, $learning, true))>
            {{ $label }}
        </label>
    @endforeach
</div>
@error('learning') <p class="text-xs font-bold text-red-600">{{ $message }}</p> @enderror
