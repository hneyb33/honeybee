<?php

namespace App\Support;

use App\Models\Place;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class Places
{
    /**
     * Save a typed place that is not already in the location library.
     *
     * @return array{city: string, area: string, latitude: ?float, longitude: ?float}
     */
    public static function pin(string $city, string $area, ?float $latitude, ?float $longitude, int|string|null $userId): array
    {
        $userId = $userId !== null && $userId !== '' ? (int) $userId : null;
        $city = self::label($city);
        $area = self::label($area);
        $library = UgandaLocations::libraryPoint($area);

        if ($library && $library['latitude'] !== null && $library['longitude'] !== null && ($city === '' || strcasecmp($city, 'Uganda') === 0 || strcasecmp($city, $library['city']) === 0)) {
            return [
                'city' => $library['city'],
                'area' => $library['name'],
                'latitude' => $latitude ?? $library['latitude'],
                'longitude' => $longitude ?? $library['longitude'],
            ];
        }

        if ($latitude === null || $longitude === null) {
            $resolved = self::resolve($city, $area);
            $latitude = $resolved['latitude'];
            $longitude = $resolved['longitude'];
        }

        if ($latitude === null || $longitude === null) {
            throw ValidationException::withMessages([
                'neighborhood' => 'Drop a pin on the map so this place can be saved and searched.',
            ]);
        }

        $place = Place::query()->firstOrNew([
            'name' => $area,
            'city' => $city !== '' ? $city : 'Uganda',
        ]);
        $place->latitude = $latitude;
        $place->longitude = $longitude;

        if (! $place->exists) {
            $place->created_by = $userId;
        }

        $place->save();

        return [
            'city' => $place->city,
            'area' => $place->name,
            'latitude' => (float) $place->latitude,
            'longitude' => (float) $place->longitude,
        ];
    }

    public static function capture(string $location, ?float $latitude, ?float $longitude, int|string|null $userId): void
    {
        $parsed = self::parse($location);

        if ($parsed['term'] === '') {
            return;
        }

        try {
            self::pin(
                $parsed['city'] !== '' ? $parsed['city'] : 'Uganda',
                $parsed['area'] !== '' ? $parsed['area'] : $parsed['term'],
                $latitude,
                $longitude,
                $userId,
            );
        } catch (ValidationException) {
            // The typed name can still match profiles already saved with that place.
        }
    }

    public static function applyFilter(Builder $query, string $location): void
    {
        $parsed = self::parse($location);

        if ($parsed['term'] === '') {
            return;
        }

        $library = UgandaLocations::libraryPoint($parsed['area'] !== '' ? $parsed['area'] : $parsed['term']);
        $place = $library ? null : (self::find($parsed['city'], $parsed['area']) ?? self::find('', $parsed['term']));

        $query->where(function (Builder $query) use ($parsed, $place) {
            if ($parsed['city'] !== '' && $parsed['area'] !== '') {
                $query->where(function (Builder $query) use ($parsed) {
                    $query->where('city', 'like', '%'.$parsed['city'].'%')
                        ->where('neighborhood', 'like', '%'.$parsed['area'].'%');
                });
            } else {
                $query->where('city', 'like', '%'.$parsed['term'].'%')
                    ->orWhere('neighborhood', 'like', '%'.$parsed['term'].'%');
            }

            if ($place) {
                $query->orWhere(function (Builder $query) use ($place) {
                    $query->where('city', $place->city)->where('neighborhood', $place->name);
                });

                $reach = 15 / 111;

                $query->orWhere(function (Builder $query) use ($place, $reach) {
                    $query->whereNotNull('latitude')
                        ->whereNotNull('longitude')
                        ->whereBetween('latitude', [$place->latitude - $reach, $place->latitude + $reach])
                        ->whereBetween('longitude', [$place->longitude - $reach, $place->longitude + $reach]);
                });
            }
        });
    }

    /**
     * @return array{found: bool, latitude: ?float, longitude: ?float}
     */
    public static function resolve(string $city, string $area): array
    {
        $city = self::label($city);
        $area = self::label($area);

        if ($area === '') {
            return ['found' => false, 'latitude' => null, 'longitude' => null];
        }

        $library = UgandaLocations::libraryPoint($area);

        if ($library && $library['latitude'] !== null && $library['longitude'] !== null && ($city === '' || strcasecmp($city, 'Uganda') === 0 || strcasecmp($city, $library['city']) === 0)) {
            return [
                'found' => true,
                'latitude' => (float) $library['latitude'],
                'longitude' => (float) $library['longitude'],
            ];
        }

        $existing = self::find($city, $area) ?? self::find('', $area);

        if ($existing) {
            return [
                'found' => true,
                'latitude' => (float) $existing->latitude,
                'longitude' => (float) $existing->longitude,
            ];
        }

        $geocoded = self::geocode(trim($area.', '.$city.', Uganda', ', '));

        if ($geocoded) {
            return [
                'found' => true,
                'latitude' => $geocoded['latitude'],
                'longitude' => $geocoded['longitude'],
            ];
        }

        return ['found' => false, 'latitude' => null, 'longitude' => null];
    }

    public static function find(string $city, string $area): ?Place
    {
        if ($area === '' || ! Schema::hasTable('places')) {
            return null;
        }

        return Place::query()
            ->whereRaw('lower(name) = ?', [mb_strtolower(self::label($area))])
            ->when($city !== '', fn (Builder $query) => $query->whereRaw('lower(city) = ?', [mb_strtolower(self::label($city))]))
            ->first();
    }

    /**
     * @return array{city: string, area: string, term: string}
     */
    public static function parse(string $location): array
    {
        $location = trim($location);

        if (str_contains($location, '|')) {
            [$city, $area] = array_pad(explode('|', $location, 2), 2, '');

            return [
                'city' => trim($city),
                'area' => trim($area),
                'term' => trim($area),
            ];
        }

        if (str_contains($location, ',')) {
            $parts = array_values(array_filter(array_map('trim', explode(',', $location)), fn (string $part): bool => $part !== ''));

            if (count($parts) >= 2) {
                $city = (string) array_pop($parts);
                $area = implode(', ', $parts);

                return [
                    'city' => $city,
                    'area' => $area,
                    'term' => $area,
                ];
            }
        }

        return [
            'city' => '',
            'area' => '',
            'term' => $location,
        ];
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    public static function geocodeGoogle(string $query): ?array
    {
        $key = config('services.google.maps_key');

        if (! is_string($key) || $key === '') {
            return null;
        }

        try {
            $response = Http::timeout(6)->acceptJson()->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $query,
                'components' => 'country:UG',
                'key' => $key,
            ]);
        } catch (\Throwable) {
            return null;
        }

        $match = $response->json('results.0.geometry.location');

        if (! is_array($match) || ! isset($match['lat'], $match['lng'])) {
            return null;
        }

        return [
            'latitude' => (float) $match['lat'],
            'longitude' => (float) $match['lng'],
        ];
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    public static function geocode(string $query): ?array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Honeybee/1.0 (profile location search)',
            ])->timeout(6)->acceptJson()->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query,
                'format' => 'jsonv2',
                'limit' => 1,
                'countrycodes' => 'ug',
            ]);
        } catch (\Throwable) {
            return null;
        }

        $match = $response->json('0');

        if (! is_array($match) || ! isset($match['lat'], $match['lon'])) {
            return null;
        }

        return [
            'latitude' => (float) $match['lat'],
            'longitude' => (float) $match['lon'],
        ];
    }

    public static function label(string $name): string
    {
        $name = trim(preg_replace('/\s+/', ' ', $name) ?? '');

        return $name === '' ? '' : mb_convert_case(mb_strtolower($name), MB_CASE_TITLE, 'UTF-8');
    }
}
