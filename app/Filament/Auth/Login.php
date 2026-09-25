<?php

namespace App\Filament\Auth;

use App\Models\Setting;
use Filament\Auth\Pages\Login as BaseLogin;

class Login extends BaseLogin
{
    public function mount(): void
    {
        if (Setting::get('super_admin_registered') !== '1') {
            redirect()->to(filament()->getRegistrationUrl());

            return;
        }

        parent::mount();
    }
}
