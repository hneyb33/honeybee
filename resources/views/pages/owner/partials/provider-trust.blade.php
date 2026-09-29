@php
    use App\Support\HomeServiceCatalog;
    $profile = $profile ?? $escort;
    $saved = is_array($saved ?? null) ? $saved : [];
    $reference = $profile->references->first();
    $hasCertificate = old('has_certificate', $saved['has_certificate'] ?? ($profile->has_certificate ? 'yes' : 'no'));
    $referenceChoice = old('reference_choice', $saved['reference_choice'] ?? ($reference ? 'yes' : 'later'));
@endphp

<fieldset>
    <legend class="text-sm font-semibold text-neutral-900">Do you have a training certificate?</legend>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
        @foreach (['no' => 'No', 'yes' => 'Yes'] as $value => $label)
            <label class="cursor-pointer rounded-xl border border-neutral-300 px-4 py-4 text-sm has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
                <input type="radio" name="has_certificate" value="{{ $value }}" class="sr-only" x-model="certificate" @checked($hasCertificate === $value)>
                {{ $label }}
            </label>
        @endforeach
    </div>
</fieldset>

<div x-show="certificate === 'yes'" x-cloak class="space-y-3">
    <label class="block text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">What type?</span>
        <select name="certificate_type" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
            <option value="">Choose a type</option>
            @foreach (HomeServiceCatalog::CERTIFICATES as $value => $label)
                <option value="{{ $value }}" @selected(old('certificate_type', $saved['certificate_type'] ?? $profile->certificate_type) === $value)>{{ $label }}</option>
            @endforeach
        </select>
        @error('certificate_type') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label class="block text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Add certificate photo</span>
        <input type="file" name="certificate" accept="image/*" class="w-full text-sm">
        @error('certificate') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
        @if ($profile->certificate_path)
            <span class="mt-2 block text-xs text-neutral-500">A certificate photo is already saved. Choose a new photo only if you want to replace it.</span>
        @endif
    </label>
</div>

<fieldset>
    <legend class="text-sm font-semibold text-neutral-900">Can someone recommend your work?</legend>
    <p class="mt-1 text-xs text-neutral-500">References are optional. One recommendation helps customers trust you.</p>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
        @foreach (['yes' => 'Yes', 'later' => 'Not right now'] as $value => $label)
            <label class="cursor-pointer rounded-xl border border-neutral-300 px-4 py-4 text-sm has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
                <input type="radio" name="reference_choice" value="{{ $value }}" class="sr-only" x-model="reference" @checked($referenceChoice === $value)>
                {{ $label }}
            </label>
        @endforeach
    </div>
</fieldset>

<div x-show="reference === 'yes'" x-cloak class="space-y-3">
    <label class="block text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Their name</span>
        <input name="referee_name" value="{{ old('referee_name', $saved['referee_name'] ?? $reference->name ?? '') }}" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm" placeholder="Sarah">
        @error('referee_name') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label class="block text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone number</span>
        <input name="referee_phone" value="{{ old('referee_phone', $saved['referee_phone'] ?? $reference->phone ?? '') }}" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm" placeholder="07XX XXX XXX">
        @error('referee_phone') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label class="block text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">How do they know your work?</span>
        <select name="referee_relationship" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
            <option value="">Choose one</option>
            @foreach (HomeServiceCatalog::RELATIONSHIPS as $value => $label)
                <option value="{{ $value }}" @selected(old('referee_relationship', $saved['referee_relationship'] ?? $reference->relationship ?? '') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        @error('referee_relationship') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    @if ($reference)
        <p class="text-sm text-neutral-600">Status: {{ $reference->status === 'confirmed' ? 'Reference confirmed' : ($reference->status === 'rejected' ? 'Not confirmed' : 'Not confirmed yet') }}</p>
    @endif
</div>

<details class="rounded-xl border border-neutral-200 px-4 py-3">
    <summary class="cursor-pointer text-sm font-semibold">Add more details</summary>
    <div class="mt-3 space-y-3">
        <p class="text-xs text-neutral-500">Legal name and date of birth stay private. They are not shown on the public profile.</p>
        <label class="block text-sm">Legal name
            <input name="legal_name" value="{{ old('legal_name', $saved['legal_name'] ?? '') }}" class="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm">
        </label>
        <label class="block text-sm">Date of birth
            <input name="date_of_birth" type="date" value="{{ old('date_of_birth', $saved['date_of_birth'] ?? '') }}" class="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm">
            @error('date_of_birth') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
        </label>
        <label class="block text-sm">Training place, if you want to add it
            <input name="institution" value="{{ old('institution', $saved['institution'] ?? '') }}" class="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm">
        </label>
    </div>
</details>
