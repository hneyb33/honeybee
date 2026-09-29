<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * @var array<string, string>
     */
    private array $defaults = [
        // Roughly USD 5 per month at 3,700 UGX to the dollar.
        'client_basic_daily_price' => '2000',
        'client_basic_monthly_price' => '18500',
        'client_basic_yearly_price' => '185000',
        'client_basic_custom_price' => '10000',
        'client_basic_custom_days' => '14',
        'escort_premium_daily_price' => '15000',
        'escort_premium_monthly_price' => '70000',
        'escort_premium_yearly_price' => '500000',
        'escort_premium_custom_price' => '100000',
        'escort_premium_custom_days' => '14',
    ];

    public function up(): void
    {
        foreach ($this->defaults as $key => $value) {
            if (Setting::get($key) === null) {
                Setting::put($key, $value);
            }
        }
    }

    public function down(): void
    {
        Setting::query()->whereIn('key', array_keys($this->defaults))->delete();
    }
};
