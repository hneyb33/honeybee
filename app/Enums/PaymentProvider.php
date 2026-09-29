<?php

namespace App\Enums;

enum PaymentProvider: string
{
    case MtnMomo = 'mtn_momo';
    case AirtelMoney = 'airtel_money';

    public function label(): string
    {
        return match ($this) {
            self::MtnMomo => 'MTN MoMoPay',
            self::AirtelMoney => 'Airtel Money Pay',
        };
    }

    public function configKey(): string
    {
        return match ($this) {
            self::MtnMomo => 'payments.mtn.merchant_code',
            self::AirtelMoney => 'payments.airtel.merchant_code',
        };
    }

    public function instructions(): string
    {
        return match ($this) {
            self::MtnMomo => 'Dial *165*3#, enter the merchant code, the amount, and confirm with your PIN.',
            self::AirtelMoney => 'Follow the Airtel Money Pay prompts and pay the exact amount shown above.',
        };
    }
}
