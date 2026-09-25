<?php

namespace App\Providers\Filament;

use App\Filament\Auth\Login;
use App\Filament\Auth\RegisterSuperAdmin;
use Filament\Http\Middleware\Authenticate;
use Filament\Navigation\NavigationGroup;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login(Login::class)
            ->registration(RegisterSuperAdmin::class)
            ->sidebarCollapsibleOnDesktop()
            ->viteTheme('resources/css/filament/admin/theme.css')
            ->colors([
                'primary' => '#222222',
                'danger' => '#dc2626',
                'gray' => '#222222',
                'success' => '#059669',
            ])
            ->brandName('HoneyBee Admin')
            ->brandLogo(asset('images/logo.jpeg'))
            ->brandLogoHeight('2.5rem')
            ->favicon(asset('images/favicon.ico'))
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->navigationGroups([
                NavigationGroup::make('Directory')->icon('heroicon-o-rectangle-stack')->collapsible(),
                NavigationGroup::make('People')->icon('heroicon-o-users')->collapsible(),
                NavigationGroup::make('Commerce')->icon('heroicon-o-banknotes')->collapsible(),
                NavigationGroup::make('Support')->icon('heroicon-o-lifebuoy')->collapsible(),
                NavigationGroup::make('Settings')->icon('heroicon-o-cog-6-tooth')->collapsible(),
                NavigationGroup::make('Administration')->icon('heroicon-o-shield-check')->collapsible(),
            ])
            ->widgets([
                Widgets\AccountWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                TrustProxies::class,
                ConvertEmptyStringsToNull::class,
                TrimStrings::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->authGuard('admin');
    }
}
