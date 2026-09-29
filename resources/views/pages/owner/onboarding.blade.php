<x-layouts.app title="Provider onboarding - Honeybee">
    @php
        $step = $profile->onboarding_step ?: 'about';
        $saved = ($profile->onboarding_data ?? [])[$step] ?? [];
        $labels = [
            'about' => 'About you',
            'work' => 'Your work',
            'experience' => 'Your experience',
            'trust' => 'Trust',
            'finish' => 'Finish',
        ];
        $position = (int) array_search($step, $steps, true) + 1;
        $occupation = old('service_type', $profile->service_type ?: 'private_chef');
        $certificate = old('has_certificate', $profile->has_certificate ? 'yes' : 'no');
        $referenceChoice = old('reference_choice', $profile->references->isNotEmpty() ? 'yes' : 'later');
    @endphp
    <section class="mx-auto max-w-2xl px-6 py-10">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">{{ $position }} of {{ count($steps) }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-neutral-900">{{ $labels[$step] ?? 'Onboarding' }}</h1>
        <p class="mt-2 text-sm text-neutral-500">You can leave and come back. Progress stays on this account.</p>
        <ol class="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
            @foreach ($steps as $name)
                <li class="{{ $name === $step ? 'font-semibold text-neutral-900' : '' }}">{{ $labels[$name] }}</li>
            @endforeach
        </ol>
        @if (session('status'))
            <p class="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm">{{ session('status') }}</p>
        @endif
        @if ($errors->any())
            <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p class="font-semibold">Save did not continue. Fix these fields:</p>
                <ul class="mt-2 list-disc pl-5">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('provider.onboard.store') }}" enctype="multipart/form-data" class="mt-8 space-y-4"
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
            @if ($step === 'about')
                @include('pages.owner.partials.provider-about', ['profile' => $profile, 'saved' => $saved])
            @elseif ($step === 'work')
                <p class="text-sm text-neutral-600">Choose your occupation, then tick the work you can do. Set a price for each one.</p>
                @include('pages.owner.partials.provider-work', ['profile' => $profile, 'saved' => $saved])
            @elseif ($step === 'experience')
                @include('pages.owner.partials.provider-experience', ['profile' => $profile, 'saved' => $saved])
            @elseif ($step === 'trust')
                @include('pages.owner.partials.provider-trust', ['profile' => $profile, 'saved' => $saved])
            @else
                @include('pages.owner.partials.provider-schedule', ['profile' => $profile, 'saved' => $saved])
                <div>
                    <p class="mb-3 text-sm text-neutral-600">Add photos and one video of your work. These are the only files accepted.</p>
                    @include('pages.owner.partials.media-dropzone', ['uploadHelper' => 'Add at least 3 photos and one video'])
                </div>
                <p class="text-sm leading-6 text-neutral-700">{{ $profile->title }} · {{ $profile->serviceLabel() ?: 'Home service' }} · {{ $profile->neighborhood }}, {{ $profile->city }}. The profile stays hidden until an admin verifies it. A specialist subscription is required before it is listed.</p>
            @endif

            <div class="flex flex-wrap gap-3 pt-2">
                @if ($position > 1)
                    <button name="back" value="1" formnovalidate class="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold">Back</button>
                @endif
                @if ($step === 'finish')
                    <button name="finish" value="1" class="rounded-lg bg-[#0f0a0a] px-4 py-3 text-sm font-semibold text-white">Finish registration</button>
                @else
                    <button class="rounded-lg bg-[#0f0a0a] px-4 py-3 text-sm font-semibold text-white">Save and continue</button>
                @endif
            </div>
        </form>
    </section>
</x-layouts.app>
