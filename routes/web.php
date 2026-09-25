<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\Owner\EscortController as OwnerEscortController;
use App\Http\Controllers\Owner\ProviderOnboardingController;
use App\Http\Controllers\ProfileController;
use App\Models\Escort;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/age-check', function () {
    return view('age-check');
})->name('age-check');

Route::post('/age-check', function (Request $request) {
    if ($request->boolean('over_18')) {
        session(['allowed_age' => true]);
        return redirect()->intended('/');
    }

    return redirect()->route('age-check')->with('age_denied', true);
})->name('age-check.submit');

Route::get('/', function (Request $request) {
    if (! $request->session()->get('allowed_age', false)) {
        return redirect()->route('age-check');
    }

    return view('pages.home');
})->name('home');

Route::get('/escorts/{escort:slug}', function (Request $request, Escort $escort) {
    if (! $request->session()->get('allowed_age', false)) {
        return redirect()->route('age-check');
    }

    $owns = $request->user()?->id === $escort->user_id;
    $published = $escort->isVerified() && $escort->owner?->hasActiveSpecialistSubscription();

    abort_unless($owns || $published || $request->user()?->isAdmin(), 404);

    if (! $owns && ! $request->user()?->isAdmin() && $escort->isVip() && ! $request->user()?->isPremiumClient()) {
        abort(404);
    }

    return view('pages.escort-detail', compact('escort'));
})->name('escort.show');

Route::get('/privacy', function () {
    return view('pages.legal', [
        'title' => 'Privacy policy',
        'body' => \App\Models\Setting::get('privacy_policy', 'Privacy policy will be published by the admin.'),
    ]);
})->name('legal.privacy');

Route::get('/terms', function () {
    return view('pages.legal', [
        'title' => 'Terms and conditions',
        'body' => \App\Models\Setting::get('terms', 'Terms will be published by the admin.'),
    ]);
})->name('legal.terms');

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::get('/register/{role}', [RegisteredUserController::class, 'create'])->name('register.form');
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();

        if ($user->isAdmin()) {
            return redirect('/admin');
        }

        if ($user->isSpecialist()) {
            return app(OwnerEscortController::class)->index(request());
        }

        return app(ClientController::class)->index(request());
    })->name('dashboard');
    Route::get('/subscribe', function () {
        return view('pages.subscribe');
    })->name('subscribe');
    Route::post('/client/subscribe', [ClientController::class, 'subscribe'])->name('client.subscribe');
    Route::post('/client/bookings/{booking}/review', [ClientController::class, 'review'])->name('client.reviews.store');
    Route::get('/owner/escorts', [OwnerEscortController::class, 'index'])->name('owner.escorts.index');
    Route::get('/provider/onboarding', [ProviderOnboardingController::class, 'show'])->name('provider.onboard');
    Route::post('/provider/onboarding', [ProviderOnboardingController::class, 'store'])->name('provider.onboard.store');
    Route::get('/owner/escorts/create', [OwnerEscortController::class, 'create'])->name('owner.escorts.create');
    Route::post('/owner/escorts', [OwnerEscortController::class, 'store'])->name('owner.escorts.store');
    Route::get('/owner/escorts/{escort}/edit', [OwnerEscortController::class, 'edit'])->name('owner.escorts.edit');
    Route::put('/owner/escorts/{escort}', [OwnerEscortController::class, 'update'])->name('owner.escorts.update');
    Route::post('/owner/subscribe', [OwnerEscortController::class, 'subscribe'])->name('owner.subscribe');
    Route::post('/owner/bookings/{booking}', [OwnerEscortController::class, 'respond'])->name('owner.bookings.respond');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('/confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('/confirm-password', [ConfirmablePasswordController::class, 'store']);
    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
