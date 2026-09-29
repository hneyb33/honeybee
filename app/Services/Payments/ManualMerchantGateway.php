<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentProvider;
use App\Models\Setting;

class ManualMerchantGateway implements PaymentGateway
{
    public function __construct(private PaymentProvider $provider) {}

    public function key(): string
    {
        return $this->provider->value;
    }

    public function label(): string
    {
        return $this->provider->label();
    }

    public function merchantCode(): string
    {
        $key = match ($this->provider) {
            PaymentProvider::MtnMomo => 'mtn_momo_merchant_code',
            PaymentProvider::AirtelMoney => 'airtel_money_merchant_code',
        };
        $saved = trim((string) (Setting::get($key) ?? ''));

        if ($saved !== '') {
            return $saved;
        }

        return trim((string) config($this->provider->configKey()));
    }

    public function instructions(): string
    {
        return $this->provider->instructions();
    }
}
