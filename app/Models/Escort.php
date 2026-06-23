<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'title',
    'slug',
    'age',
    'gender',
    'ethnicity',
    'nationality',
    'height',
    'weight',
    'hair_color',
    'hair_length',
    'bust_size',
    'build',
    'looks',
    'smoker',
    'education',
    'sports',
    'zodiac_sign',
    'sexual_orientation',
    'occupation',
    'availability',
    'country',
    'phone',
    'summary_line',
    'description',
    'about_me',
    'services_offered',
    'languages',
    'rates',
    'extra_services',
    'tier',
    'category',
    'status',
    'neighborhood',
    'city',
    'monthly_price',
    'rating',
    'review_count',
    'bedrooms',
    'bathrooms',
    'plot_size',
    'parking',
    'whatsapp_number',
    'cover_image',
    'images',
    'amenities',
    'is_featured',
])]
class Escort extends Model
{
    protected function casts(): array
    {
        return [
            'images' => 'array',
            'amenities' => 'array',
            'services_offered' => 'array',
            'languages' => 'array',
            'rates' => 'array',
            'extra_services' => 'boolean',
            'is_featured' => 'boolean',
            'monthly_price' => 'integer',
            'rating' => 'decimal:2',
            'review_count' => 'integer',
            'age' => 'integer',
        ];
    }

    protected function priceLabel(): Attribute
    {
        return Attribute::get(function (): string {
            if ($this->monthly_price >= 1000000) {
                return 'UGX '.number_format($this->monthly_price / 1000000, 1).'M';
            }

            return 'UGX '.number_format($this->monthly_price / 1000).'K';
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
