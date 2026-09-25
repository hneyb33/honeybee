@php($stats = $this->stats())
<div class="grid gap-4 md:grid-cols-3">
    <a href="{{ \App\Filament\Resources\EscortResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Models</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['models'] }}</p>
    </a>
    <a href="{{ \App\Filament\Resources\ProviderResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Private service providers</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['providers'] }}</p>
    </a>
    <a href="{{ \App\Filament\Resources\EscortResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Pending verification</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['pending_profiles'] }}</p>
    </a>
</div>
<div class="mt-4 grid gap-4 md:grid-cols-3">
    <a href="{{ \App\Filament\Resources\BookingResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Booking requests</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['booking_requests'] }}</p>
    </a>
    <a href="{{ \App\Filament\Resources\OrderResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Orders</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['orders'] }}</p>
    </a>
    <a href="{{ \App\Filament\Resources\PaymentResource::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-gray-500">Payments to review</p>
        <p class="mt-3 text-3xl font-semibold text-gray-900">{{ $stats['payments'] }}</p>
    </a>
</div>
<div class="mt-6 grid gap-4 md:grid-cols-2">
    <a href="{{ \App\Filament\Pages\Support::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="font-semibold text-gray-900">Support</p>
        <p class="mt-1 text-sm text-gray-500">Privacy policy, terms, and the complaints Telegram chat.</p>
    </a>
    <a href="{{ \App\Filament\Pages\Settings::getUrl() }}" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="font-semibold text-gray-900">Settings</p>
        <p class="mt-1 text-sm text-gray-500">Prices, subscription periods, support account, and payment channels.</p>
    </a>
</div>
