<?php

namespace App\Listeners;

use App\Events\PaymentRejected;
use App\Events\PaymentSubmitted;
use App\Events\PaymentVerified;
use App\Models\User;
use App\Notifications\PaymentRejectedNotification;
use App\Notifications\PaymentSubmittedNotification;
use App\Notifications\PaymentVerifiedNotification;
use Throwable;

class SendPaymentNotifications
{
    public function submitted(PaymentSubmitted $event): void
    {
        $this->safely(function () use ($event) {
            User::role(['super_admin', 'moderator'])->get()
                ->each(fn (User $admin) => $admin->notify(new PaymentSubmittedNotification($event->payment)));
        });
    }

    public function verified(PaymentVerified $event): void
    {
        $this->safely(function () use ($event) {
            $event->payment->user?->notify(new PaymentVerifiedNotification($event->payment));
        });
    }

    public function rejected(PaymentRejected $event): void
    {
        $this->safely(function () use ($event) {
            $event->payment->user?->notify(new PaymentRejectedNotification($event->payment));
        });
    }

    private function safely(callable $callback): void
    {
        try {
            $callback();
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
