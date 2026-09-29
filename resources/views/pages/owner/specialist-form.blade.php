<x-layouts.app title="Home service profile - Honeybee">
    @php
        $profile = $escort;
        $occupation = old('service_type', $profile->service_type ?: 'private_chef');
        $certificate = old('has_certificate', $profile->has_certificate ? 'yes' : 'no');
        $referenceChoice = old('reference_choice', $profile->references->isNotEmpty() ? 'yes' : 'later');
    @endphp
    <section class="mx-auto max-w-3xl px-6 py-10">
        <h1 class="text-3xl font-semibold text-neutral-900">Edit your service</h1>
        <p class="mt-2 text-sm text-neutral-600">Update your work, prices, location, and the days you are available.</p>
        @if ($errors->any())
            <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <ul class="list-disc pl-5">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        <form method="POST" action="{{ route('owner.escorts.update', $profile) }}" enctype="multipart/form-data" class="mt-8 space-y-8"
            x-data="{
                occupation: @js($occupation),
                certificate: @js($certificate),
                reference: @js($referenceChoice),
                speak(text) {
                    if (! window.speechSynthesis) return;
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'en';
                    window.speechSynthesis.speak(utterance);
                }
            }">
            @csrf
            @method('PUT')
            @include('pages.owner.partials.provider-about', ['profile' => $profile])
            @include('pages.owner.partials.provider-work', ['profile' => $profile])
            @include('pages.owner.partials.provider-experience', ['profile' => $profile])
            @include('pages.owner.partials.provider-trust', ['profile' => $profile])
            @include('pages.owner.partials.provider-schedule', ['profile' => $profile])
            <div>
                <p class="mb-3 text-sm text-neutral-600">Add more photos or a video of your work. Photos and videos only.</p>
                @include('pages.owner.partials.media-dropzone', ['uploadHelper' => 'Add at least 3 photos and one video'])
            </div>
            <button class="rounded-lg bg-[#0f0a0a] px-5 py-3 text-sm font-semibold text-white">Save service</button>
        </form>
    </section>
</x-layouts.app>
