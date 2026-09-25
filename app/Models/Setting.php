<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    public static function put(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * @return array<string, string>
     */
    public static function bag(array $keys): array
    {
        $stored = static::query()->whereIn('key', $keys)->pluck('value', 'key');

        $bag = [];
        foreach ($keys as $key) {
            $bag[$key] = (string) ($stored[$key] ?? '');
        }

        return $bag;
    }
}
