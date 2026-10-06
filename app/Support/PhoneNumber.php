<?php

namespace App\Support;

class PhoneNumber
{
    /**
     * Reduce any Ugandan number to the 256XXXXXXXXX form used for storage and login.
     */
    public static function national(string $countryCode, ?string $phone): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '';
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if ($code !== '' && str_starts_with($digits, $code) && strlen($digits) > strlen($code) + 5) {
            $digits = substr($digits, strlen($code));
        }

        return ltrim($digits, '0');
    }

    public static function compose(string $countryCode, ?string $phone): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '256';

        return $code.self::national($code, $phone);
    }

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
