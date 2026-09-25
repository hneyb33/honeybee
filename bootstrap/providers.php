<?php

use App\Providers\AppServiceProvider;
use App\Providers\Filament\AdminPanelProvider;
use Spatie\Permission\PermissionServiceProvider;

return [
    AppServiceProvider::class,
    AdminPanelProvider::class,
    PermissionServiceProvider::class,
];
