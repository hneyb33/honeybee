<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public Payment $payment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment waiting for verification')
            ->line($this->payment->user?->name.' submitted '.$this->payment->reference.'.')
            ->line($this->payment->provider?->label().' · UGX '.number_format($this->payment->amount))
            ->line('Transaction '.$this->payment->transaction_id)
            ->action('Review payment', url('/admin/payments/'.$this->payment->id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'payment_id' => $this->payment->id,
            'title' => 'Payment waiting for verification',
            'body' => $this->payment->reference.' · UGX '.number_format($this->payment->amount),
        ];
    }
}
