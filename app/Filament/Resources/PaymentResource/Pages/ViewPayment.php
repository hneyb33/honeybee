<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Enums\PaymentStatus;
use App\Filament\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\User;
use App\Services\PaymentService;
use Filament\Actions\Action;
use Filament\Facades\Filament;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;
use Illuminate\Validation\ValidationException;
use Throwable;

class ViewPayment extends ViewRecord
{
    protected static string $resource = PaymentResource::class;

    public function mount(int|string $record): void
    {
        parent::mount($record);

        $this->getRecord()->load(['user.escorts', 'subscription', 'audits.admin']);
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('proof')
                ->label('View screenshot')
                ->url(fn (Payment $record) => route('payments.proof', $record))
                ->openUrlInNewTab()
                ->visible(fn (Payment $record) => filled($record->proof_path)),
            Action::make('verify')
                ->label('Verify payment')
                ->color('success')
                ->visible(fn (Payment $record) => $record->status === PaymentStatus::Submitted)
                ->action(function (): void {
                    $record = $this->getRecord();
                    $admin = Filament::auth()->user() ?? auth('admin')->user();

                    if (! $admin instanceof User) {
                        Notification::make()
                            ->title('Sign in again to verify this payment')
                            ->warning()
                            ->send();

                        return;
                    }

                    try {
                        $subscription = app(PaymentService::class)->verify($record, $admin);
                    } catch (ValidationException $exception) {
                        Notification::make()
                            ->title(collect($exception->errors())->flatten()->first() ?: 'Check the transaction details')
                            ->warning()
                            ->send();

                        return;
                    } catch (Throwable $exception) {
                        report($exception);
                        Notification::make()
                            ->title('Check the transaction details and try again')
                            ->warning()
                            ->send();

                        return;
                    }

                    $fresh = $record->fresh(['user.escorts', 'subscription', 'audits.admin']);

                    if (! $subscription || $fresh?->status !== PaymentStatus::Verified) {
                        Notification::make()
                            ->title('Check the transaction details and try again')
                            ->warning()
                            ->send();

                        return;
                    }

                    $this->record = $fresh;

                    Notification::make()
                        ->title('Payment verified and subscription activated')
                        ->success()
                        ->send();
                }),
            Action::make('reject')
                ->label('Reject payment')
                ->color('danger')
                ->visible(fn (Payment $record) => $record->status === PaymentStatus::Submitted)
                ->schema([
                    Textarea::make('rejection_reason')
                        ->label('Reason')
                        ->required()
                        ->minLength(8),
                ])
                ->action(function (array $data): void {
                    $record = $this->getRecord();
                    $admin = Filament::auth()->user() ?? auth('admin')->user();

                    if (! $admin instanceof User) {
                        Notification::make()->title('Sign in again to reject this payment')->warning()->send();

                        return;
                    }

                    try {
                        app(PaymentService::class)->reject($record, $admin, $data['rejection_reason']);
                    } catch (ValidationException $exception) {
                        Notification::make()
                            ->title(collect($exception->errors())->flatten()->first() ?: 'This payment cannot be rejected')
                            ->warning()
                            ->send();

                        return;
                    } catch (Throwable $exception) {
                        report($exception);
                        Notification::make()->title('This payment cannot be rejected')->warning()->send();

                        return;
                    }

                    $this->record = $record->fresh(['user.escorts', 'subscription', 'audits.admin']);
                    Notification::make()->title('Payment rejected')->success()->send();
                }),
        ];
    }
}
