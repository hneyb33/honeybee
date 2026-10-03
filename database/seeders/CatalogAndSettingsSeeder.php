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
            'terms' => 'You must be 18 or older. Profiles are listed only after verification and an active subscription. Premium and VIP profiles are visible to subscribed clients.',
            'complaints_telegram' => 'honeybee',
            'support_email' => 'support@honeybee.test',
            'mobile_money_name' => 'Honeybee',
            'mobile_money_number' => '0700000000',
            'bank_name' => 'Honeybee Bank',
            'bank_account_name' => 'Honeybee',
            'bank_account_number' => '0000000000',
            'client_basic_daily_price' => '2000',
            'client_basic_monthly_price' => '18500',
            'client_premium_daily_price' => '10000',
            'client_premium_monthly_price' => '50000',
            'specialist_daily_price' => '20000',
            'specialist_monthly_price' => '100000',
            'escort_premium_daily_price' => '15000',
            'escort_premium_monthly_price' => '70000',
            'escort_vip_daily_price' => '25000',
            'escort_vip_monthly_price' => '120000',
        ];

        foreach ($defaults as $key => $value) {
            if (Setting::get($key) === null) {
                Setting::put($key, $value);
            }
        }
    }
}
