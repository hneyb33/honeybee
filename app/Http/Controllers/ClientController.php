<?php

namespace App\Http\Controllers;

use App\Http\Controllers\SubscriptionPaymentController;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ClientController extends Controller
{
    public function index(Request $request): View
    {
        abort_unless($request->user()->isClient(), 403);

        $user = $request->user();

        return view('pages.client.bookings', [
            'bookings' => Booking::query()
                ->where('client_id', $user->id)
                ->with(['escort', 'review'])
                ->latest()
                ->get(),
            'subscription' => $user->subscriptions()->active()->latest('ends_at')->first(),
            'latestPayment' => $user->payments()->latest()->first(),
        ]);
    }

    public function subscribe(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isClient(), 403);

        return app(SubscriptionPaymentController::class)->begin($request);
    }

    public function review(Request $request, Booking $booking): RedirectResponse
    {
        abort_unless($booking->client_id === $request->user()->id, 403);
        abort_unless($booking->status === Booking::COMPLETED, 403);
        abort_if($booking->review()->exists(), 403);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:1000'],
        ]);

        Review::create([
            'booking_id' => $booking->id,
            'client_id' => $request->user()->id,
            'escort_id' => $booking->escort_id,
            'rating' => $validated['rating'],
            'body' => $validated['body'] ?? null,
        ]);

        $escort = $booking->escort;
        $escort->update([
            'review_count' => $escort->reviews()->count(),
            'rating' => round((float) $escort->reviews()->avg('rating'), 2),
        ]);

        return back()->with('status', 'Review saved.');
    }
}
