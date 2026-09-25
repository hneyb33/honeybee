<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Gate::before(function (?User $user) {
            static $checking = false;

            if ($checking || ! $user) {
                return null;
            }

            $checking = true;
            $isAdmin = $user->isAdmin();
            $checking = false;

            return $isAdmin ? true : null;
        });
    }
}
