<?php

namespace App\Http\Controllers;

use App\Models\Escort;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProfileReviewController extends Controller
{
    public function create(Request $request, Escort $escort): View|RedirectResponse
    {
        $redirect = $this->guard($request, $escort);

        if ($redirect) {
            return $redirect;
        }

        $review = Review::query()
            ->where('client_id', $request->user()->id)
            ->where('escort_id', $escort->id)
            ->first();

        return view('pages.reviews.create', [
            'escort' => $escort,
            'review' => $review,
        ]);
    }

    public function store(Request $request, Escort $escort): RedirectResponse
    {
        $redirect = $this->guard($request, $escort);

        if ($redirect) {
            return $redirect;
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::query()->firstOrNew([
            'client_id' => $request->user()->id,
            'escort_id' => $escort->id,
        ]);
        $review->rating = $validated['rating'];
        $review->body = $validated['body'] ?? null;
        $review->save();

        $escort->update([
            'review_count' => $escort->reviews()->count(),
            'rating' => round((float) $escort->reviews()->avg('rating'), 2),
        ]);

        return redirect()
            ->route('escort.show', $escort)
            ->with('status', 'Review saved.');
    }

    private function guard(Request $request, Escort $escort): ?RedirectResponse
    {
        if (! $request->session()->get('allowed_age', false)) {
            session(['url.intended' => $request->fullUrl()]);

            return redirect()->route('age-check');
        }

        $user = $request->user();
        abort_unless($user && $user->isClient(), 403);
        abort_if($user->id === $escort->user_id, 403);

        $published = $escort->isVerified() && (bool) $escort->owner?->hasActiveListingSubscription();
        abort_unless($published, 404);

        if ($escort->isVip() && ! $user->isPremiumClient()) {
            return redirect()
                ->route('subscribe')
                ->with('status', 'A subscription is required to browse VIP profiles.');
        }

        return null;
    }
}
