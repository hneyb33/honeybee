<?php

namespace Database\Seeders;

use App\Models\CatalogService;
use App\Models\Escort;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogAndSettingsSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Escort::OFFERED_SERVICES as $name) {
            CatalogService::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'group' => 'escort', 'is_active' => true],
            );
        }

        foreach ([
            'private-chef' => 'Private chef',
            'home-laundry' => 'Home laundry',
            'private-massage' => 'Private massage',
        ] as $slug => $name) {
            CatalogService::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'group' => 'home', 'is_active' => true],
            );
        }

        $defaults = [
            'privacy_policy' => 'Honeybee collects account and booking details so specialists and clients can meet. We do not publish identity documents.',
            'terms' => 'You must be 18 or older. Profiles are listed only after verification and an active specialist subscription. VIP profiles are visible to premium clients.',
            'complaints_telegram' => 'honeybee',
            'support_email' => 'support@honeybee.test',
            'mobile_money_name' => 'Honeybee',
            'mobile_money_number' => '0700000000',
            'bank_name' => 'Honeybee Bank',
            'bank_account_name' => 'Honeybee',
            'bank_account_number' => '0000000000',
            'client_premium_daily_price' => '10000',
            'client_premium_monthly_price' => '50000',
            'client_premium_yearly_price' => '400000',
            'client_premium_custom_price' => '80000',
            'client_premium_custom_days' => '14',
            'specialist_daily_price' => '20000',
            'specialist_monthly_price' => '100000',
            'specialist_yearly_price' => '800000',
            'specialist_custom_price' => '150000',
            'specialist_custom_days' => '14',
        ];

        foreach ($defaults as $key => $value) {
            if (Setting::get($key) === null) {
                Setting::put($key, $value);
            }
        }
    }
}
