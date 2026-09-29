<?php

namespace App\Support;

class PhoneNumber
{
    /**
     * Reduce any Ugandan number to the 256XXXXXXXXX form used for storage and login.
     */
    public static function normalize(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '256')) {
            return $digits;
        }

        $digits = ltrim($digits, '0');

        if (strlen($digits) === 9) {
            return '256'.$digits;
        }

        return $digits;
    }

    public static function isValid(?string $phone): bool
    {
        return (bool) preg_match('/^256\d{9}$/', self::normalize($phone));
    }
}
