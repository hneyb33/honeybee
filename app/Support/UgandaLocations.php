<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;

class UgandaLocations
{
    /**
     * Approximate coordinates for Kampala suburbs and major towns.
     * Used to match a browser position to a city and area.
     *
     * @var array<string, array{0: float, 1: float, 2: string}>
     */
    public const POINTS = [
        'Kololo' => [0.332, 32.594, 'Kampala'],
        'Nakasero' => [0.323, 32.578, 'Kampala'],
        'Bugolobi' => [0.313, 32.610, 'Kampala'],
        'Naguru' => [0.338, 32.612, 'Kampala'],
        'Ntinda' => [0.353, 32.615, 'Kampala'],
        'Bukoto' => [0.348, 32.590, 'Kampala'],
        'Kamwokya' => [0.340, 32.585, 'Kampala'],
        'Makerere' => [0.333, 32.568, 'Kampala'],
        'Wandegeya' => [0.333, 32.573, 'Kampala'],
        'Nakawa' => [0.333, 32.620, 'Kampala'],
        'Kireka' => [0.348, 32.648, 'Kampala'],
        'Bweyogerere' => [0.360, 32.665, 'Kampala'],
        'Najjera' => [0.378, 32.630, 'Kampala'],
        'Kisaasi' => [0.370, 32.600, 'Kampala'],
        'Kyaliwajjala' => [0.385, 32.640, 'Kampala'],
        'Lubowa' => [0.248, 32.560, 'Kampala'],
        'Munyonyo' => [0.240, 32.625, 'Kampala'],
        'Muyenga' => [0.295, 32.610, 'Kampala'],
        'Kansanga' => [0.285, 32.605, 'Kampala'],
        'Kabalagala' => [0.298, 32.600, 'Kampala'],
        'Nsambya' => [0.302, 32.585, 'Kampala'],
        'Kibuli' => [0.310, 32.590, 'Kampala'],
        'Mengo' => [0.305, 32.560, 'Kampala'],
        'Rubaga' => [0.302, 32.552, 'Kampala'],
        'Kawempe' => [0.370, 32.560, 'Kampala'],
        'Bwaise' => [0.355, 32.560, 'Kampala'],
        'Kyanja' => [0.375, 32.610, 'Kampala'],
        'Namugongo' => [0.395, 32.650, 'Kampala'],
        'Kampala' => [0.348, 32.583, 'Kampala'],
        'Entebbe' => [0.064, 32.443, 'Entebbe'],
        'Jinja' => [0.424, 33.204, 'Jinja'],
        'Mukono' => [0.353, 32.755, 'Mukono'],
        'Wakiso' => [0.404, 32.460, 'Wakiso'],
        'Mbarara' => [-0.607, 30.655, 'Mbarara'],
        'Gulu' => [2.775, 32.299, 'Gulu'],
        'Mbale' => [1.075, 34.175, 'Mbale'],
        'Fort Portal' => [0.672, 30.275, 'Fort Portal'],
        'Masaka' => [-0.334, 31.734, 'Masaka'],
        'Lira' => [2.250, 32.900, 'Lira'],
        'Soroti' => [1.715, 33.611, 'Soroti'],
        'Arua' => [3.020, 30.911, 'Arua'],
        'Hoima' => [1.433, 31.353, 'Hoima'],
        'Kabale' => [-1.249, 29.989, 'Kabale'],
    ];

    /** @var array<string, array<int, string>>|null */
    private static ?array $cachedMap = null;

    /**
     * @return array<int, string>
     */
    public static function cities(): array
    {
        return array_keys(self::map());
    }

    /**
     * @return array<int, string>
     */
    public static function areas(string $city): array
    {
        $map = self::map();

        foreach ($map as $name => $areas) {
            if (strcasecmp($name, $city) === 0) {
                return $areas;
            }
        }

        return [$city];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function map(): array
    {
        if (self::$cachedMap !== null) {
            return self::$cachedMap;
        }

        $map = self::pointMap();
        $districts = self::districtRows();

        if ($districts === []) {
            return self::$cachedMap = $map;
        }

        $counties = self::countiesByDistrict();

        foreach ($districts as $district) {
            $name = self::label((string) $district['name']);

            if (strcasecmp($name, 'Kampala') === 0) {
                $map['Kampala'] = self::kampalaSuburbs();

                continue;
            }

            $names = array_values(array_unique(array_map(
                fn (string $area): string => self::label($area),
                $counties[$district['id']] ?? [],
            )));
            $map[$name] = $names !== [] ? $names : ($map[$name] ?? [$name]);
        }

        ksort($map);

        return self::$cachedMap = $map;
    }

    /**
     * @return array{city: string, area: string, latitude: float, longitude: float}|null
     */
    public static function nearest(float $latitude, float $longitude): ?array
    {
        $best = null;
        $bestDistance = null;

        foreach (self::POINTS as $name => [$lat, $lng, $city]) {
            $distance = (($latitude - $lat) ** 2) + (($longitude - $lng) ** 2);

            if ($bestDistance === null || $distance < $bestDistance) {
                $bestDistance = $distance;
                $choices = self::areas($city);
                $best = [
                    'city' => array_key_exists($city, self::map()) ? $city : (self::matchingCity($city) ?? $city),
                    'area' => in_array($name, $choices, true) ? $name : ($choices[0] ?? $city),
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ];
            }
        }

        return $best;
    }

    /**
     * @return array<string, array<int, string>>
     */
    private static function pointMap(): array
    {
        $map = [];

        foreach (self::POINTS as $name => $point) {
            $city = $point[2];
            $map[$city] ??= [];

            if ($name !== $city) {
                $map[$city][] = $name;
            }
        }

        foreach ($map as $city => $areas) {
            sort($areas);
            $map[$city] = $areas !== [] ? $areas : [$city];
        }

        ksort($map);

        return $map;
    }

    /**
     * @return array<int, string>
     */
    private static function kampalaSuburbs(): array
    {
        $suburbs = [];

        foreach (self::POINTS as $name => $point) {
            if ($point[2] === 'Kampala' && $name !== 'Kampala') {
                $suburbs[] = $name;
            }
        }

        sort($suburbs);

        return $suburbs;
    }

    /**
     * @return array<int, array{id: int|string, name: string}>
     */
    private static function districtRows(): array
    {
        if (! class_exists(\Gp10devhts\UgVillageLocations\Models\District::class) || ! Schema::hasTable('ug_districts')) {
            return [];
        }

        return \Gp10devhts\UgVillageLocations\Models\District::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($district): array => ['id' => $district->id, 'name' => $district->name])
            ->all();
    }

    /**
     * @return array<int|string, array<int, string>>
     */
    private static function countiesByDistrict(): array
    {
        if (! class_exists(\Gp10devhts\UgVillageLocations\Models\County::class) || ! Schema::hasTable('ug_counties')) {
            return [];
        }

        $grouped = [];

        foreach (\Gp10devhts\UgVillageLocations\Models\County::query()->orderBy('name')->get(['district_id', 'name']) as $county) {
            $grouped[$county->district_id][] = $county->name;
        }

        return $grouped;
    }

    private static function label(string $name): string
    {
        return mb_convert_case(mb_strtolower($name), MB_CASE_TITLE, 'UTF-8');
    }

    private static function matchingCity(string $city): ?string
    {
        foreach (array_keys(self::map()) as $name) {
            if (strcasecmp($name, $city) === 0) {
                return $name;
            }
        }

        return null;
    }
}
