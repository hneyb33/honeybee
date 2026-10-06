<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Escort;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfileContactController extends Controller
{
    public function __invoke(Request $request, Escort $escort, string $channel): RedirectResponse
    {
        abort_unless(in_array($channel, [Booking::CHANNEL_WHATSAPP, Booking::CHANNEL_TELEGRAM], true), 404);

        if (! $request->session()->get('allowed_age', false)) {
            session(['url.intended' => $request->fullUrl()]);

            return redirect()->route('age-check');
        }

        $user = $request->user();

        if (! $user) {
            session(['url.intended' => $request->fullUrl()]);

            return redirect()->route('login')->with('status', 'Log in to contact this profile on WhatsApp or Telegram.');
        }

        $owns = $user->id === $escort->user_id;

        if (! $owns && ! $user->isAdmin() && $escort->isVip() && ! $user->isPremiumClient()) {
            return redirect()
                ->route('subscribe')
                ->with('status', 'A subscription is required to browse VIP profiles.');
        }

        $destination = $channel === Booking::CHANNEL_WHATSAPP
            ? $escort->whatsappUrl()
            : $escort->telegramUrl();

        abort_unless($destination, 404);

        if (! $owns && ! $user->isAdmin()) {
            Booking::create([
                'client_id' => $user->id,
                'escort_id' => $escort->id,
                'channel' => $channel,
                'status' => Booking::CONTACTED,
                'starts_at' => now(),
                'duration_hours' => 0,
                'price_amount' => 0,
                'currency' => 'UGX',
                'note' => $channel === Booking::CHANNEL_WHATSAPP ? 'WhatsApp' : 'Telegram',
            ]);
        }

        return redirect()->away($destination);
    }
}
