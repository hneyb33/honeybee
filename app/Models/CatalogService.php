<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'group', 'is_active'])]
class CatalogService extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saving(function (CatalogService $service): void {
            if (! $service->slug) {
                $service->slug = Str::slug($service->name);
            }
        });
    }
}
