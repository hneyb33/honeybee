<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Enums\PaymentStatus;
use App\Filament\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Filament\Actions\Action;
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
                ->action(function (Payment $record): void {
                    try {
                        app(PaymentService::class)->verify($record, auth()->user());
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

                    Notification::make()
                        ->title('Payment verified and subscription activated')
                        ->success()
                        ->send();

                    $this->redirect(PaymentResource::getUrl('view', ['record' => $record]));
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
                ->action(function (Payment $record, array $data): void {
                    app(PaymentService::class)->reject($record, auth()->user(), $data['rejection_reason']);
                    Notification::make()->title('Payment rejected')->success()->send();
                }),
        ];
    }
}
