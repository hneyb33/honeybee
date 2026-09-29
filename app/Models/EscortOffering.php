<?php

namespace App\Models;

use App\Support\HomeServiceCatalog;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'escort_id',
    'service_key',
    'group_name',
    'name',
    'price',
    'pricing_unit',
    'service_location',
    'turnaround',
    'is_addon',
    'sort_order',
])]
class EscortOffering extends Model
{
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'is_addon' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function escort(): BelongsTo
    {
        return $this->belongsTo(Escort::class);
    }

    public function priceLabel(): string
    {
        if ($this->pricing_unit === 'quote') {
            return 'Quote';
        }

        $amount = 'UGX '.number_format((int) $this->price);

        return $amount.' · '.HomeServiceCatalog::unitLabel($this->pricing_unit);
    }

    public function locationLabel(): string
    {
        return HomeServiceCatalog::LOCATIONS[$this->service_location] ?? (string) $this->service_location;
    }
}
