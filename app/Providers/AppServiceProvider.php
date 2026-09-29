<?php

namespace App\Providers;

use App\Events\PaymentRejected;
use App\Events\PaymentSubmitted;
use App\Events\PaymentVerified;
use App\Listeners\SendPaymentNotifications;
use App\Models\User;
use Illuminate\Support\Facades\Event;
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
        $this->registerUgandaLocations();
    }

    private function registerUgandaLocations(): void
    {
        spl_autoload_register(static function (string $class): void {
            $prefix = 'Gp10devhts\\UgVillageLocations\\';

            if (! str_starts_with($class, $prefix)) {
                return;
            }

            $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
            $path = base_path('vendor/gp10devhts/ug-village-locations/src/'.$relative.'.php');

            if (is_file($path)) {
                require_once $path;
            }
        });

        $provider = \Gp10devhts\UgVillageLocations\UgVillageLocationsServiceProvider::class;

        if (class_exists($provider) && ! $this->app->providerIsLoaded($provider)) {
            $this->app->register($provider);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        $notifications = SendPaymentNotifications::class;
        Event::listen(PaymentSubmitted::class, [$notifications, 'submitted']);
        Event::listen(PaymentVerified::class, [$notifications, 'verified']);
        Event::listen(PaymentRejected::class, [$notifications, 'rejected']);

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
