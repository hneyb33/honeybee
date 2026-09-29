<?php

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    Subscription::query()
        ->where('status', SubscriptionStatus::Active->value)
        ->whereNotNull('ends_at')
        ->where('ends_at', '<=', now())
        ->each(function (Subscription $subscription) {
            $subscription->update(['status' => SubscriptionStatus::Expired->value]);
        });
})->hourly();
