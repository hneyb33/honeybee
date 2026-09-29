<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'escort_vip_daily_price' => '25000',
            'escort_vip_monthly_price' => '120000',
            'escort_vip_yearly_price' => '900000',
            'escort_vip_custom_price' => '180000',
            'escort_vip_custom_days' => '14',
        ];

        foreach ($defaults as $key => $value) {
            $exists = DB::table('settings')->where('key', $key)->exists();

            if ($exists) {
                continue;
            }

            DB::table('settings')->insert([
                'key' => $key,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'escort_vip_daily_price',
            'escort_vip_monthly_price',
            'escort_vip_yearly_price',
            'escort_vip_custom_price',
            'escort_vip_custom_days',
        ])->delete();
    }
};
