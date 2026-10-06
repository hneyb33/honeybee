<?php

namespace App\Support;

use App\Models\Escort;
use App\Models\EscortReference;
use App\Models\ProfileMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProviderProfile
{
    /**
     * @return array<string, mixed>
     */
    public static function validateAbout(Request $request): array
    {
        return $request->validate([
            'display_name' => ['required', 'string', 'max:120'],
            'gender' => ['nullable', 'in:female,male'],
            'nationality' => ['required', Rule::in(Escort::NATIONALITIES)],
            'languages' => ['required', 'array', 'min:1'],
            'languages.*' => [Rule::in(Escort::LANGUAGES)],
            'city' => ['required', Rule::in(UgandaLocations::cities())],
            'neighborhood' => ['required', Rule::in(UgandaLocations::areas((string) $request->input('city', 'Kampala')))],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'travel_km' => ['nullable', 'in:5,10,20,50,anywhere'],
            'whatsapp_code' => ['required', Rule::in(array_keys(Escort::DIAL_CODES))],
            'whatsapp_number' => ['required', 'string', 'max:40'],
            'telegram_code' => ['nullable', Rule::in(array_keys(Escort::DIAL_CODES))],
            'telegram' => ['nullable', 'string', 'max:80'],
            'bio' => ['required', 'string', 'min:20', 'max:2500'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function validateWork(Request $request): array
    {
        $type = $request->validate([
            'service_type' => ['required', Rule::in(array_keys(HomeServiceCatalog::OCCUPATIONS))],
            'other_occupation' => ['nullable', 'required_if:service_type,other', 'string', 'max:120'],
        ]);

        $rows = $type['service_type'] === 'other'
            ? self::customRows($request)
            : self::catalogRows($request, $type['service_type']);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'offerings' => 'Choose at least one service.',
            ]);
        }

        $type['offering_rows'] = $rows;
        $type['occupation'] = $type['service_type'] === 'other'
            ? $type['other_occupation']
            : HomeServiceCatalog::OCCUPATIONS[$type['service_type']];

        return $type;
    }

    /**
     * @return array<string, mixed>
     */
    public static function validateExperience(Request $request): array
    {
        return $request->validate([
            'experience_band' => ['required', Rule::in(array_keys(HomeServiceCatalog::EXPERIENCE))],
            'learning' => ['required', 'array', 'min:1'],
            'learning.*' => [Rule::in(array_keys(HomeServiceCatalog::LEARNING))],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function validateTrust(Request $request, ?Escort $profile = null): array
    {
        $data = $request->validate([
            'has_certificate' => ['required', 'in:yes,no'],
            'certificate_type' => ['nullable', 'required_if:has_certificate,yes', Rule::in(array_keys(HomeServiceCatalog::CERTIFICATES))],
            'certificate' => ['nullable', 'image', 'max:10240'],
            'reference_choice' => ['required', 'in:yes,later'],
            'referee_name' => ['nullable', 'required_if:reference_choice,yes', 'string', 'max:120'],
            'referee_phone' => ['nullable', 'required_if:reference_choice,yes', 'string', 'max:40'],
            'referee_relationship' => ['nullable', 'required_if:reference_choice,yes', Rule::in(array_keys(HomeServiceCatalog::RELATIONSHIPS))],
            'legal_name' => ['nullable', 'string', 'max:160'],
            'date_of_birth' => ['nullable', 'date', 'before:-18 years'],
            'institution' => ['nullable', 'string', 'max:160'],
        ]);

        if ($data['has_certificate'] === 'yes' && ! $request->hasFile('certificate') && ! $profile?->certificate_path) {
            throw ValidationException::withMessages([
                'certificate' => 'Add a photo of the certificate.',
            ]);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public static function validateFinish(Request $request, Escort $profile): array
    {
        $request->validate([
            'photos' => ['nullable', 'array', 'max:9'],
            'photos.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov', 'max:51200'],
        ]);

        self::assertPortfolio($request, $profile);

        return ['hours' => self::validateSchedule($request)];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function validateAll(Request $request, Escort $profile): array
    {
        $errors = [];
        $result = [];

        foreach ([
            'about' => fn () => self::validateAbout($request),
            'work' => fn () => self::validateWork($request),
            'experience' => fn () => self::validateExperience($request),
            'trust' => fn () => self::validateTrust($request, $profile),
            'finish' => fn () => self::validateFinish($request, $profile),
        ] as $key => $validator) {
            try {
                $result[$key] = $validator();
            } catch (ValidationException $exception) {
                $errors = array_merge($errors, $exception->errors());
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $result;
    }

    /**
     * @param  array<string, array<string, mixed>>  $validated
     */
    public static function apply(Escort $profile, array $validated, Request $request): void
    {
        self::applyAbout($profile, $validated['about']);
        self::applyWork($profile, $validated['work']);
        self::applyExperience($profile, $validated['experience']);
        self::applyTrust($profile, $validated['trust'], $request);
        $profile->weekly_hours = $validated['finish']['hours'];
        $profile->onboarding_data = array_merge($profile->onboarding_data ?? [], [
            'about' => $validated['about'],
            'work' => collect($validated['work'])->except('offering_rows')->all(),
            'experience' => $validated['experience'],
            'trust' => collect($validated['trust'])->except('certificate')->all(),
            'finish' => ['hours' => $validated['finish']['hours']],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function applyAbout(Escort $profile, array $data): void
    {
        $profile->title = $data['display_name'];
        $profile->description = $data['bio'];
        $profile->about_me = $data['bio'];
        if (! empty($data['gender'])) {
            $profile->gender = $data['gender'];
        } else {
            $profile->gender = '';
        }
        $profile->nationality = $data['nationality'];
        $profile->languages = array_values($data['languages']);
        $profile->city = $data['city'];
        $profile->neighborhood = $data['neighborhood'];
        $profile->latitude = $data['latitude'] ?? $profile->latitude;
        $profile->longitude = $data['longitude'] ?? $profile->longitude;
        $profile->travel_km = $data['travel_km'] ?? null;
        $profile->phone = $data['whatsapp_number'];
        $profile->whatsapp_number = $data['whatsapp_number'];
        $profile->whatsapp_code = $data['whatsapp_code'];
        $profile->telegram = $data['telegram'] ?? null;
        $profile->telegram_code = $data['telegram_code'] ?? '+256';
        $profile->summary_line = trim(($profile->serviceLabel() ?: 'Home service').' in '.$data['neighborhood'].', '.$data['city']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function applyWork(Escort $profile, array $data): void
    {
        $profile->service_type = $data['service_type'];
        $profile->occupation = $data['occupation'];
        $profile->summary_line = trim($data['occupation'].' in '.$profile->neighborhood.', '.$profile->city);

        $rows = $data['offering_rows'];
        $profile->offerings()->delete();

        foreach ($rows as $index => $row) {
            $profile->offerings()->create($row + ['sort_order' => $index]);
        }

        $profile->services_offered = array_column($rows, 'name');
        $prices = array_values(array_filter(array_column($rows, 'price')));

        if ($prices !== []) {
            $profile->hourly_rate = min($prices);
            $profile->monthly_price = min($prices);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function applyExperience(Escort $profile, array $data): void
    {
        $profile->experience_band = $data['experience_band'];
        $profile->learning_methods = array_values($data['learning']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function applyTrust(Escort $profile, array $data, Request $request): void
    {
        $profile->has_certificate = $data['has_certificate'] === 'yes';
        $profile->certificate_type = $profile->has_certificate ? ($data['certificate_type'] ?? null) : null;

        if ($request->hasFile('certificate')) {
            $profile->certificate_path = $request->file('certificate')->store('certificates/'.$profile->id, 'public');
        }

        if ($data['reference_choice'] !== 'yes') {
            return;
        }

        $existing = $profile->references()->first();
        $payload = [
            'name' => $data['referee_name'],
            'phone' => $data['referee_phone'],
            'relationship' => $data['referee_relationship'],
        ];

        if (! $existing) {
            $profile->references()->create($payload + [
                'status' => EscortReference::NOT_CONFIRMED,
                'verification_token' => Str::random(40),
            ]);

            return;
        }

        $changed = $existing->name !== $payload['name'] || $existing->phone !== $payload['phone'];
        $existing->fill($payload);

        if ($changed) {
            $existing->status = EscortReference::NOT_CONFIRMED;
            $existing->verified_at = null;
            $existing->verification_token = Str::random(40);
        }

        $existing->save();
    }

    public static function storePhotos(Request $request, Escort $profile): void
    {
        if (! $request->hasFile('photos')) {
            return;
        }

        $coverSet = filled($profile->cover_image);
        $sort = (int) $profile->media()->max('sort_order') + 1;

        foreach ($request->file('photos') as $file) {
            $isVideo = str_starts_with((string) $file->getMimeType(), 'video');
            $path = \App\Support\MediaFiles::store($file, 'profiles/'.$profile->id);
            ProfileMedia::create([
                'escort_id' => $profile->id,
                'path' => $path,
                'kind' => $isVideo ? 'video' : 'image',
                'sort_order' => $sort,
            ]);
            $sort++;

            if (! $isVideo && ! $coverSet) {
                $profile->update(['cover_image' => \App\Support\MediaFiles::url($path)]);
                $coverSet = true;
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function catalogRows(Request $request, string $occupation): array
    {
        $items = collect(HomeServiceCatalog::items($occupation))->keyBy('key');
        $rows = [];
        $errors = [];

        foreach ($request->input('offerings', []) as $key => $row) {
            if (empty($row['selected']) || ! $items->has($key)) {
                continue;
            }

            $item = $items[$key];
            $parsed = self::pricedRow($key, $row, $occupation, (bool) $item['addon'], $errors);

            if ($parsed === null) {
                continue;
            }

            $rows[] = $parsed + [
                'service_key' => $key,
                'group_name' => $item['group'],
                'name' => $item['name'],
                'is_addon' => $item['addon'],
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function customRows(Request $request): array
    {
        $rows = [];
        $errors = [];

        foreach ($request->input('custom', []) as $index => $row) {
            $name = trim((string) ($row['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $parsed = self::pricedRow('custom.'.$index, $row, 'other', false, $errors);

            if ($parsed === null) {
                continue;
            }

            $rows[] = $parsed + [
                'service_key' => 'custom-'.Str::slug($name).'-'.$index,
                'group_name' => 'Services',
                'name' => $name,
                'is_addon' => false,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, string>  $errors
     * @return array<string, mixed>|null
     */
    private static function pricedRow(string $key, array $row, string $occupation, bool $addon, array &$errors): ?array
    {
        $unit = (string) ($row['unit'] ?? '');
        $units = HomeServiceCatalog::units($occupation);
        $prefix = str_starts_with($key, 'custom.') ? $key : 'offerings.'.$key;

        if (! isset($units[$unit])) {
            $errors[$prefix.'.unit'] = 'Choose a pricing unit.';
        }

        $location = (string) ($row['location'] ?? '');

        if (! isset(HomeServiceCatalog::LOCATIONS[$location])) {
            $errors[$prefix.'.location'] = 'Choose where you provide this service.';
        }

        $minimum = $addon || $unit === 'quote' ? 0 : 1000;
        $price = $row['price'] ?? null;

        if ($price === null || $price === '' || ! is_numeric($price) || (int) $price < $minimum) {
            $errors[$prefix.'.price'] = $minimum === 0
                ? 'Enter a price, or 0 if this extra is included.'
                : 'Enter a price of at least 1,000 UGX.';
        }

        $turnaround = trim((string) ($row['turnaround'] ?? ''));

        if (strlen($turnaround) > 80) {
            $errors[$prefix.'.turnaround'] = 'Keep this note under 80 characters.';
        }

        if (isset($errors[$prefix.'.unit']) || isset($errors[$prefix.'.location']) || isset($errors[$prefix.'.price']) || isset($errors[$prefix.'.turnaround'])) {
            return null;
        }

        return [
            'price' => (int) $price,
            'pricing_unit' => $unit,
            'service_location' => $location,
            'turnaround' => $turnaround !== '' ? $turnaround : null,
        ];
    }

    /**
     * @return array<string, array{on: bool, from: ?string, to: ?string}>
     */
    private static function validateSchedule(Request $request): array
    {
        $hours = [];
        $errors = [];
        $any = false;

        foreach (HomeServiceCatalog::DAYS as $key => $label) {
            $day = $request->input('hours.'.$key, []);
            $on = filter_var($day['on'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $from = self::normalizeTime($day['from'] ?? null);
            $to = self::normalizeTime($day['to'] ?? null);

            if ($on) {
                $any = true;

                if (! $from || ! $to) {
                    $errors['hours.'.$key.'.from'] = 'Add a start and end time for '.$label.'.';
                } elseif ($from >= $to) {
                    $errors['hours.'.$key.'.to'] = 'End time must be later than the start time on '.$label.'.';
                }
            }

            $hours[$key] = ['on' => $on, 'from' => $from, 'to' => $to];
        }

        if (! $any) {
            $errors['hours'] = 'Turn on at least one day you can work.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $hours;
    }

    private static function normalizeTime(mixed $value): ?string
    {
        $value = trim((string) $value);

        if (preg_match('/^(\d{2}):(\d{2})/', $value, $matches) !== 1) {
            return null;
        }

        return $matches[1].':'.$matches[2];
    }

    private static function assertPortfolio(Request $request, Escort $profile): void
    {
        $images = $profile->media()->where('kind', 'image')->count();
        $videos = $profile->media()->where('kind', 'video')->count();

        foreach ($request->file('photos', []) as $file) {
            $mime = (string) $file->getMimeType();

            if (str_starts_with($mime, 'video')) {
                $videos++;
            } elseif (str_starts_with($mime, 'image')) {
                $images++;
            }
        }

        if ($images < 3 || $videos < 1) {
            throw ValidationException::withMessages([
                'photos' => 'Add at least 3 photos and one video.',
            ]);
        }
    }
}
