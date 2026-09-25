<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingRequested extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New booking request')
            ->line($this->booking->client->name.' requested '.$this->booking->escort->title.'.')
            ->line('Date: '.$this->booking->starts_at->toFormattedDateString())
            ->action('Open your dashboard', url('/owner/escorts'));
    }
}
