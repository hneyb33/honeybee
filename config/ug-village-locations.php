<?php

use Gp10devhts\UgVillageLocations\Models\County;
use Gp10devhts\UgVillageLocations\Models\District;
use Gp10devhts\UgVillageLocations\Models\Parish;
use Gp10devhts\UgVillageLocations\Models\SubCounty;
use Gp10devhts\UgVillageLocations\Models\Village;

return [
    'seed_levels' => [
        'districts',
        'counties',
    ],

    'use_uuids' => false,

    'models' => [
        'district' => District::class,
        'county' => County::class,
        'sub_county' => SubCounty::class,
        'parish' => Parish::class,
        'village' => Village::class,
    ],
];
