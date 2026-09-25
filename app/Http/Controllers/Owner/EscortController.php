<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Escort;
use App\Models\ProfileMedia;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\View\View;

class EscortController extends Controller
{
    public function index(Request $request): View
    {
        abort_unless($request->user()->isSpecialist(), 403);

        return view('pages.owner.index', [
            'escorts' => Escort::query()->where('user_id', Auth::id())->with('media')->latest()->get(),
            'bookings' => Booking::query()->whereHas('escort', fn ($query) => $query->where('user_id', Auth::id()))->with('client', 'escort')->latest()->get(),
        ]);
    }

    public function create(): View|RedirectResponse
    {
        abort_unless(Auth::user()->isSpecialist(), 403);

        if (Auth::user()->isHomeSpecialist()) {
            return redirect()->route('provider.onboard');
        }

        return view('pages.owner.create-escort');
    }

    public function subscribe(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isSpecialist(), 403);
        $request->validate([
            'period' => ['in:daily,monthly,yearly,custom'],
        ]);
        $request->user()->activatePlan(Subscription::PLAN_SPECIALIST, $request->input('period', 'monthly'));

        return back()->with('status', 'Specialist subscription is active. Submit your profile for verification to be listed.');
    }

    public function respond(Request $request, Booking $booking): RedirectResponse
    {
        abort_unless($request->user()->can('update', $booking), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:accepted,declined,completed,cancelled'],
        ]);

        $booking->update(['status' => $validated['status']]);

        return back()->with('status', 'Booking updated.');
    }

    public function edit(Escort $escort): View
    {
        abort_unless($escort->user_id === Auth::id(), 403);

        if ($escort->kind === Escort::KIND_SERVICE) {
            return view('pages.owner.specialist-form', ['escort' => $escort]);
        }

        return view('pages.owner.edit-escort', [
            'escort' => $escort,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isSpecialist(), 403);

        if ($request->user()->isHomeSpecialist()) {
            return $this->storeHomeService($request);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'tier' => ['required', 'in:vip,premium'],
            'kind' => ['required', 'in:escort,service'],
            'service_type' => ['nullable', 'required_if:kind,service', 'in:private_chef,home_laundry,private_massage'],
            'telegram' => ['nullable', 'string', 'max:80'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'photos' => ['nullable', 'array', 'max:8'],
            'photos.*' => ['file', 'max:20480'],
            'category' => ['required', 'in:escort,service'],
            'neighborhood' => ['required', 'string', 'max:80'],
            'city' => ['required', 'string', 'max:80'],
            'monthly_price' => ['required', 'integer', 'min:100000', 'max:999999999'],
            'age' => ['required', 'integer', 'min:18', 'max:100'],
            'gender' => ['required', 'string', 'max:20'],
            'ethnicity' => ['nullable', 'string', 'max:80'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'height' => ['nullable', 'string', 'max:40'],
            'weight' => ['nullable', 'string', 'max:40'],
            'hair_color' => ['nullable', 'string', 'max:40'],
            'hair_length' => ['nullable', 'string', 'max:40'],
            'bust_size' => ['nullable', 'string', 'max:40'],
            'build' => ['required', 'in:'.implode(',', \App\Models\Escort::BODY_TYPES)],
            'looks' => ['nullable', 'string', 'max:40'],
            'smoker' => ['nullable', 'string', 'max:20'],
            'education' => ['nullable', 'string', 'max:80'],
            'sports' => ['nullable', 'string', 'max:80'],
            'zodiac_sign' => ['nullable', 'string', 'max:40'],
            'sexual_orientation' => ['required', 'in:'.implode(',', \App\Models\Escort::ORIENTATIONS)],
            'occupation' => ['nullable', 'string', 'max:80'],
            'availability' => ['required', 'array', 'min:1'],
            'availability.*' => ['in:'.implode(',', \App\Models\Escort::AVAILABILITY_OPTIONS)],
            'phone' => ['nullable', 'string', 'max:40'],
            'whatsapp_number' => ['required', 'string', 'max:40'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'image_urls' => ['nullable', 'string'],
            'amenities_text' => ['nullable', 'string'],
            'description' => ['required', 'string', 'min:80', 'max:2500'],
            'services' => ['required', 'array', 'min:1'],
            'services.*' => ['string'],
            'languages_text' => ['nullable', 'string'],
            'rates_text' => ['nullable', 'string'],
        ]);

        $slug = $this->uniqueSlug($validated['title']);

        if (count($request->file('photos', [])) < 3) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'photos' => 'Upload at least 3 photos before submitting for review.',
            ]);
        }

        $images = $this->parseLines($validated['image_urls'] ?? '')
            ->filter(fn (string $line) => filter_var($line, FILTER_VALIDATE_URL))
            ->values()
            ->all();

        if (($validated['cover_image'] ?? null) && ! in_array($validated['cover_image'], $images, true)) {
            array_unshift($images, $validated['cover_image']);
        }

        $escort = Escort::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'slug' => $slug,
            'summary_line' => $this->summaryLine($validated),
            'description' => $validated['description'],
            'about_me' => $validated['description'],
            'tier' => $validated['tier'],
            'kind' => 'escort',
            'escort_tier' => $validated['tier'],
            'service_type' => null,
            'category' => 'escort',
            'status' => 'pending',
            'verification_status' => 'pending',
            'neighborhood' => $validated['neighborhood'],
            'city' => $validated['city'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'monthly_price' => $validated['monthly_price'],
            'hourly_rate' => $validated['monthly_price'],
            'rating' => 0,
            'review_count' => 0,
            'age' => $validated['age'],
            'gender' => $validated['gender'],
            'ethnicity' => $validated['ethnicity'] ?? null,
            'nationality' => $validated['nationality'] ?? null,
            'height' => $validated['height'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'hair_color' => $validated['hair_color'] ?? null,
            'hair_length' => $validated['hair_length'] ?? null,
            'bust_size' => $validated['bust_size'] ?? null,
            'build' => $validated['build'] ?? null,
            'looks' => $validated['looks'] ?? null,
            'smoker' => $validated['smoker'] ?? null,
            'education' => $validated['education'] ?? null,
            'sports' => $validated['sports'] ?? null,
            'zodiac_sign' => $validated['zodiac_sign'] ?? null,
            'sexual_orientation' => $validated['sexual_orientation'] ?? null,
            'occupation' => $validated['occupation'] ?? null,
            'availability' => implode(', ', $validated['availability'] ?? []),
            'country' => 'Uganda',
            'phone' => $validated['phone'] ?? null,
            'whatsapp_number' => $validated['whatsapp_number'],
            'telegram' => $validated['telegram'] ?? null,
            'cover_image' => $validated['cover_image'] ?? ($images[0] ?? null),
            'images' => $images,
            'amenities' => $this->parseAmenities($validated['amenities_text'] ?? ''),
            'services_offered' => array_values(array_intersect($validated['services'] ?? [], Escort::offeredServices())),
            'languages' => $this->parseKeyValueLines($validated['languages_text'] ?? ''),
            'rates' => $this->parseKeyValueLines($validated['rates_text'] ?? ''),
            'is_featured' => false,
        ]);

        $this->storePhotos($request, $escort);

        return redirect()
            ->route('owner.escorts.index')
            ->with('status', 'Profile submitted for verification. It stays hidden until an admin approves it.');
    }

    public function update(Request $request, Escort $escort): RedirectResponse
    {
        abort_unless($escort->user_id === Auth::id(), 403);

        if ($escort->kind === Escort::KIND_SERVICE) {
            $validated = $this->validateHomeService($request, false);
            $escort->update($this->homeServiceAttributes($validated));
            $this->storePhotos($request, $escort);

            return redirect()->route('owner.escorts.index')->with('status', 'Service profile updated.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'tier' => ['required', 'in:vip,premium'],
            'kind' => ['required', 'in:escort,service'],
            'service_type' => ['nullable', 'required_if:kind,service', 'in:private_chef,home_laundry,private_massage'],
            'telegram' => ['nullable', 'string', 'max:80'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'photos' => ['nullable', 'array', 'max:8'],
            'photos.*' => ['file', 'max:20480'],
            'category' => ['required', 'in:escort,service'],
            'neighborhood' => ['required', 'string', 'max:80'],
            'city' => ['required', 'string', 'max:80'],
            'monthly_price' => ['required', 'integer', 'min:100000', 'max:999999999'],
            'age' => ['required', 'integer', 'min:18', 'max:100'],
            'gender' => ['required', 'string', 'max:20'],
            'ethnicity' => ['nullable', 'string', 'max:80'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'height' => ['nullable', 'string', 'max:40'],
            'weight' => ['nullable', 'string', 'max:40'],
            'hair_color' => ['nullable', 'string', 'max:40'],
            'hair_length' => ['nullable', 'string', 'max:40'],
            'bust_size' => ['nullable', 'string', 'max:40'],
            'build' => ['required', 'in:'.implode(',', \App\Models\Escort::BODY_TYPES)],
            'looks' => ['nullable', 'string', 'max:40'],
            'smoker' => ['nullable', 'string', 'max:20'],
            'education' => ['nullable', 'string', 'max:80'],
            'sports' => ['nullable', 'string', 'max:80'],
            'zodiac_sign' => ['nullable', 'string', 'max:40'],
            'sexual_orientation' => ['required', 'in:'.implode(',', \App\Models\Escort::ORIENTATIONS)],
            'occupation' => ['nullable', 'string', 'max:80'],
            'availability' => ['required', 'array', 'min:1'],
            'availability.*' => ['in:'.implode(',', \App\Models\Escort::AVAILABILITY_OPTIONS)],
            'phone' => ['nullable', 'string', 'max:40'],
            'whatsapp_number' => ['required', 'string', 'max:40'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'image_urls' => ['nullable', 'string'],
            'amenities_text' => ['nullable', 'string'],
            'description' => ['required', 'string', 'min:80', 'max:2500'],
            'services_text' => ['nullable', 'string'],
            'languages_text' => ['nullable', 'string'],
            'rates_text' => ['nullable', 'string'],
        ]);

        $images = $this->parseLines($validated['image_urls'] ?? '')
            ->filter(fn (string $line) => filter_var($line, FILTER_VALIDATE_URL))
            ->values()
            ->all();

        if (($validated['cover_image'] ?? null) && ! in_array($validated['cover_image'], $images, true)) {
            array_unshift($images, $validated['cover_image']);
        }

        $escort->update([
            'title' => $validated['title'],
            'summary_line' => $this->summaryLine($validated),
            'description' => $validated['description'],
            'about_me' => $validated['description'],
            'tier' => $validated['tier'],
            'kind' => $validated['kind'],
            'escort_tier' => $validated['kind'] === 'escort' ? $validated['tier'] : null,
            'service_type' => $validated['kind'] === 'service' ? ($validated['service_type'] ?? null) : null,
            'category' => $validated['category'],
            'neighborhood' => $validated['neighborhood'],
            'city' => $validated['city'],
            'latitude' => $validated['latitude'] ?? $escort->latitude,
            'longitude' => $validated['longitude'] ?? $escort->longitude,
            'monthly_price' => $validated['monthly_price'],
            'hourly_rate' => $validated['monthly_price'],
            'age' => $validated['age'],
            'gender' => $validated['gender'],
            'ethnicity' => $validated['ethnicity'] ?? null,
            'nationality' => $validated['nationality'] ?? null,
            'height' => $validated['height'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'hair_color' => $validated['hair_color'] ?? null,
            'hair_length' => $validated['hair_length'] ?? null,
            'bust_size' => $validated['bust_size'] ?? null,
            'build' => $validated['build'] ?? null,
            'looks' => $validated['looks'] ?? null,
            'smoker' => $validated['smoker'] ?? null,
            'education' => $validated['education'] ?? null,
            'sports' => $validated['sports'] ?? null,
            'zodiac_sign' => $validated['zodiac_sign'] ?? null,
            'sexual_orientation' => $validated['sexual_orientation'] ?? null,
            'occupation' => $validated['occupation'] ?? null,
            'availability' => implode(', ', $validated['availability'] ?? []),
            'phone' => $validated['phone'] ?? null,
            'whatsapp_number' => $validated['whatsapp_number'],
            'telegram' => $validated['telegram'] ?? $escort->telegram,
            'cover_image' => $validated['cover_image'] ?? ($images[0] ?? $escort->cover_image),
            'images' => $images ?: $escort->images,
            'amenities' => $this->parseAmenities($validated['amenities_text'] ?? ''),
            'services_offered' => $this->parseLines($validated['services_text'] ?? '')->all(),
            'languages' => $this->parseKeyValueLines($validated['languages_text'] ?? ''),
            'rates' => $this->parseKeyValueLines($validated['rates_text'] ?? ''),
        ]);

        $this->storePhotos($request, $escort);

        return redirect()
            ->route('owner.escorts.index')
            ->with('status', 'Your service profile has been updated.');
    }

    private function storeHomeService(Request $request): RedirectResponse
    {
        $validated = $this->validateHomeService($request, true);

        $escort = Escort::create(array_merge($this->homeServiceAttributes($validated), [
            'user_id' => Auth::id(),
            'slug' => $this->uniqueSlug($validated['title']),
            'status' => 'pending',
            'verification_status' => 'pending',
            'rating' => 0,
            'review_count' => 0,
            'country' => 'Uganda',
            'is_featured' => false,
        ]));

        $this->storePhotos($request, $escort);

        return redirect()
            ->route('owner.escorts.index')
            ->with('status', 'Service profile submitted for verification.');
    }

    private function validateHomeService(Request $request, bool $creating): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'service_type' => ['required', 'in:private_chef,home_laundry,private_massage'],
            'neighborhood' => ['required', 'string', 'max:80'],
            'city' => ['required', 'string', 'max:80'],
            'monthly_price' => ['required', 'integer', 'min:20000', 'max:999999999'],
            'availability' => ['nullable', 'string', 'max:120'],
            'whatsapp_number' => ['required', 'string', 'max:40'],
            'telegram' => ['nullable', 'string', 'max:80'],
            'description' => ['required', 'string', 'min:40', 'max:2500'],
            'photos' => [$creating ? 'required' : 'nullable', 'array', $creating ? 'min:3' : 'min:0', 'max:8'],
            'photos.*' => ['file', 'max:20480'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function homeServiceAttributes(array $validated): array
    {
        $label = match ($validated['service_type']) {
            'private_chef' => 'Private chef',
            'home_laundry' => 'Home laundry',
            default => 'Private massage',
        };

        return [
            'title' => $validated['title'],
            'summary_line' => $label.' in '.$validated['city'],
            'description' => $validated['description'],
            'about_me' => $validated['description'],
            'tier' => 'premium',
            'kind' => Escort::KIND_SERVICE,
            'escort_tier' => null,
            'service_type' => $validated['service_type'],
            'category' => 'service',
            'neighborhood' => $validated['neighborhood'],
            'city' => $validated['city'],
            'monthly_price' => $validated['monthly_price'],
            'hourly_rate' => $validated['monthly_price'],
            'availability' => $validated['availability'] ?? 'Home visit',
            'whatsapp_number' => $validated['whatsapp_number'],
            'telegram' => $validated['telegram'] ?? null,
            'services_offered' => [$label],
        ];
    }

    private function storePhotos(Request $request, Escort $escort): void
    {
        if (! $request->hasFile('photos')) {
            return;
        }

        foreach ($request->file('photos') as $index => $file) {
            $path = $file->store('profiles/'.$escort->id, 'public');
            ProfileMedia::create([
                'escort_id' => $escort->id,
                'path' => $path,
                'kind' => str_starts_with((string) $file->getMimeType(), 'video') ? 'video' : 'image',
                'sort_order' => $index,
            ]);

            if ($index === 0) {
                $escort->update(['cover_image' => Storage::disk('public')->url($path)]);
            }
        }
    }

    /**
     * @return array<int, string>
     */
    private function parseKeyValueLines(string $value): array
    {
        return $this->parseLines($value)
            ->map(function (string $line): array {
                [$key, $val] = array_pad(explode(':', $line, 2), 2, null);

                return [trim($key) => trim($val ?: '')];
            })
            ->reduce(function ($carry, $item) {
                return array_merge($carry, $item);
            }, []);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $count = 2;

        while (Escort::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }

    /**
     * @return \Illuminate\Support\Collection<int, string>
     */
    private function parseLines(string $value)
    {
        return Str::of($value)
            ->replace(["\r\n", "\r"], "\n")
            ->explode("\n")
            ->map(fn (string $line) => trim($line))
            ->filter();
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private function parseAmenities(string $value): array
    {
        return $this->parseLines($value)
            ->map(function (string $line): array {
                [$title, $body] = array_pad(explode(':', $line, 2), 2, null);

                return [
                    'title' => trim($title),
                    'body' => trim($body ?: 'Included with this Escort.'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function summaryLine(array $validated): string
    {
        $tier = ucfirst($validated['tier'] ?? 'escort');
        $category = ucfirst($validated['category'] ?? 'service');
        $location = $validated['neighborhood'] ?? $validated['city'] ?? 'Unknown location';

        return "{$tier} {$category} near {$location}";
    }
}
