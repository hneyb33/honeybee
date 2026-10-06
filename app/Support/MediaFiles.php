<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaFiles
{
    public static function disk(): string
    {
        $disk = config('filesystems.media_disk', 'public');

        return is_string($disk) && $disk !== '' ? $disk : 'public';
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, self::disk());
    }

    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            if (preg_match('#/storage/(.+)$#', $path, $matches) === 1) {
                $path = $matches[1];
            } else {
                return $path;
            }
        }

        $path = ltrim($path, '/');

        if (self::disk() === 'public') {
            return '/storage/'.$path;
        }

        return Storage::disk(self::disk())->url($path);
    }
}
