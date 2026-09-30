<?php

namespace App\Filament\Auth;

use App\Models\Setting;
use App\Models\User;
use Filament\Auth\Pages\Register;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Component;
use Illuminate\Database\Eloquent\Model;
use SensitiveParameter;

class RegisterSuperAdmin extends Register
{
    public function mount(): void
    {
        if (Setting::get('super_admin_registered') === '1') {
            redirect()->to(filament()->getLoginUrl());

            return;
        }

        parent::mount();
    }

    public function getHeading(): string|\Illuminate\Contracts\Support\Htmlable|null
    {
        return 'Create the super admin';
    }

    public function getSubheading(): ?string
    {
        return 'This account is created once. After that, sign in here and promote other users.';
    }

    protected function getPasswordFormComponent(): Component
    {
        return TextInput::make('password')
            ->label('Password')
            ->password()
            ->revealable(filament()->arePasswordsRevealable())
            ->required()
            ->rule(\Illuminate\Validation\Rules\Password::default())
            ->same('passwordConfirmation');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function handleRegistration(#[SensitiveParameter] array $data): Model
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->assignRole('super_admin');
        Setting::put('super_admin_registered', '1');

        return $user;
    }
}
