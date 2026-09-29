<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $plan = $user?->isClient()
            ? Subscription::PLAN_CLIENT_PREMIUM
            : Subscription::PLAN_SPECIALIST;

        if (! $user || ! $user->hasActivePlan($plan)) {
            return redirect()
                ->route('subscribe')
                ->with('status', 'An active subscription is required.');
        }

        return $next($request);
    }
}
