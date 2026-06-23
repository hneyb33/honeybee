<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Escort;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\View\View;

class EscortController extends Controller
{
    public function index(Request $request): View
    {
        return view('pages.owner.index', [
            'escorts' => Escort::query()
                ->where('user_id', Auth::id())
                ->latest()
                ->get(),
        ]);
    }

    public function create(): View
    {
        return view('pages.owner.create-escort');
    }

    public function edit(Escort $escort): View
    {
        abort_unless($escort->user_id === Auth::id(), 403);

        return view('pages.owner.edit-escort', [
            'escort' => $escort,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'tier' => ['required', 'in:vip,corporate,business'],
            'category' => ['required', 'in:escort,companion,model'],
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
            'build' => ['nullable', 'string', 'max:40'],
            'looks' => ['nullable', 'string', 'max:40'],
            'smoker' => ['nullable', 'string', 'max:20'],
            'education' => ['nullable', 'string', 'max:80'],
            'sports' => ['nullable', 'string', 'max:80'],
            'zodiac_sign' => ['nullable', 'string', 'max:40'],
            'sexual_orientation' => ['nullable', 'string', 'max:40'],
            'occupation' => ['nullable', 'string', 'max:80'],
            'availability' => ['nullable', 'string', 'max:120'],
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

        $slug = $this->uniqueSlug($validated['title']);
        $images = $this->parseLines($validated['image_urls'] ?? '')
            ->filter(fn (string $line) => filter_var($line, FILTER_VALIDATE_URL))
            ->values()
            ->all();

        if (($validated['cover_image'] ?? null) && ! in_array($validated['cover_image'], $images, true)) {
            array_unshift($images, $validated['cover_image']);
        }

        $Escort = Escort::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'slug' => $slug,
            'summary_line' => $this->summaryLine($validated),
            'description' => $validated['description'],
            'about_me' => $validated['description'],
            'tier' => $validated['tier'],
            'category' => $validated['category'],
            'status' => 'active',
            'neighborhood' => $validated['neighborhood'],
            'city' => $validated['city'],
            'monthly_price' => $validated['monthly_price'],
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
            'availability' => $validated['availability'] ?? 'Incall, Outcall',
            'country' => 'Uganda',
            'phone' => $validated['phone'] ?? null,
            'whatsapp_number' => $validated['whatsapp_number'],
            'cover_image' => $validated['cover_image'] ?? ($images[0] ?? null),
            'images' => $images,
            'amenities' => $this->parseAmenities($validated['amenities_text'] ?? ''),
            'services_offered' => $this->parseLines($validated['services_text'] ?? '')->all(),
            'languages' => $this->parseKeyValueLines($validated['languages_text'] ?? ''),
            'rates' => $this->parseKeyValueLines($validated['rates_text'] ?? ''),
            'is_featured' => false,
        ]);

        return redirect()
            ->route('escort.show', $Escort)
            ->with('status', 'Your service listing is live.');
    }

    public function update(Request $request, Escort $escort): RedirectResponse
    {
        abort_unless($escort->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'tier' => ['required', 'in:vip,corporate,business'],
            'category' => ['required', 'in:escort,companion,model'],
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
            'build' => ['nullable', 'string', 'max:40'],
            'looks' => ['nullable', 'string', 'max:40'],
            'smoker' => ['nullable', 'string', 'max:20'],
            'education' => ['nullable', 'string', 'max:80'],
            'sports' => ['nullable', 'string', 'max:80'],
            'zodiac_sign' => ['nullable', 'string', 'max:40'],
            'sexual_orientation' => ['nullable', 'string', 'max:40'],
            'occupation' => ['nullable', 'string', 'max:80'],
            'availability' => ['nullable', 'string', 'max:120'],
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
            'category' => $validated['category'],
            'neighborhood' => $validated['neighborhood'],
            'city' => $validated['city'],
            'monthly_price' => $validated['monthly_price'],
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
            'availability' => $validated['availability'] ?? 'Incall, Outcall',
            'phone' => $validated['phone'] ?? null,
            'whatsapp_number' => $validated['whatsapp_number'],
            'cover_image' => $validated['cover_image'] ?? ($images[0] ?? $escort->cover_image),
            'images' => $images ?: $escort->images,
            'amenities' => $this->parseAmenities($validated['amenities_text'] ?? ''),
            'services_offered' => $this->parseLines($validated['services_text'] ?? '')->all(),
            'languages' => $this->parseKeyValueLines($validated['languages_text'] ?? ''),
            'rates' => $this->parseKeyValueLines($validated['rates_text'] ?? ''),
        ]);

        return redirect()
            ->route('owner.escorts.index')
            ->with('status', 'Your service profile has been updated.');
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
