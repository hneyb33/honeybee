<x-layouts.app title="Home service profile - Honeybee">
    <section class="mx-auto max-w-3xl px-6 py-10">
        <h1 class="text-3xl font-semibold text-neutral-900">{{ isset($escort) ? 'Edit your service' : 'Create your home service' }}</h1>
        <p class="mt-2 text-sm text-neutral-600">Private chef, home laundry, or private massage. This form does not ask for escort details.</p>

        <form method="POST" action="{{ isset($escort) ? route('owner.escorts.update', $escort) : route('owner.escorts.store') }}" enctype="multipart/form-data" class="mt-8 space-y-5">
            @csrf
            @if (isset($escort))
                @method('PUT')
            @endif

            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Display name</span>
                <input name="title" value="{{ old('title', $escort->title ?? '') }}" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
            </label>
            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Service</span>
                <select name="service_type" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
                    @foreach (['private_chef' => 'Private chef', 'home_laundry' => 'Home laundry', 'private_massage' => 'Private massage'] as $value => $label)
                        <option value="{{ $value }}" @selected(old('service_type', $escort->service_type ?? '') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
                <label>
                    <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Area</span>
                    <input name="neighborhood" value="{{ old('neighborhood', $escort->neighborhood ?? '') }}" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
                </label>
                <label>
                    <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">City</span>
                    <input name="city" value="{{ old('city', $escort->city ?? 'Kampala') }}" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
                </label>
            </div>
            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Hourly rate (UGX)</span>
                <input name="monthly_price" type="number" min="20000" value="{{ old('monthly_price', $escort->hourly_rate ?? '') }}" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
            </label>
            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Availability</span>
                <input name="availability" value="{{ old('availability', $escort->availability ?? 'Home visit') }}" class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
                <label>
                    <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">WhatsApp</span>
                    <input name="whatsapp_number" value="{{ old('whatsapp_number', $escort->whatsapp_number ?? '') }}" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
                </label>
                <label>
                    <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Telegram</span>
                    <input name="telegram" value="{{ old('telegram', $escort->telegram ?? '') }}" class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">
                </label>
            </div>
            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">About the service</span>
                <textarea name="description" rows="6" required class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm">{{ old('description', $escort->description ?? '') }}</textarea>
            </label>
            <label class="block">
                <span class="mb-2 block text-xs font-semibold uppercase text-neutral-500">Photos, at least 3</span>
                <input type="file" name="photos[]" multiple accept="image/*,video/*" @required(! isset($escort)) class="w-full text-sm">
                @error('photos') <span class="mt-2 block text-xs text-red-600">{{ $message }}</span> @enderror
            </label>
            <button class="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">{{ isset($escort) ? 'Save service' : 'Submit for review' }}</button>
        </form>
    </section>
</x-layouts.app>
