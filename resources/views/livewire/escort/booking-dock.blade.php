<aside class="sticky top-28 h-fit rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
    <div class="mb-4 text-xl text-neutral-900"><span class="font-semibold">UGX {{ number_format($escort->rateAmount()) }}</span> <span class="text-base text-neutral-500">/ hour</span></div>
    <div class="mb-4 overflow-hidden rounded-xl border border-neutral-300">
        <div class="grid grid-cols-2">
            <label class="border-b border-r border-neutral-300 p-3">
                <span class="block text-[10px] font-bold uppercase text-neutral-800">Date</span>
                <input type="date" wire:model="appointmentDate" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-900 focus:ring-0">
            </label>
            <label class="border-b border-neutral-300 p-3">
                <span class="block text-[10px] font-bold uppercase text-neutral-800">Duration</span>
                <select wire:model="duration" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-900 focus:ring-0">
                    <option value="1">1 hour</option>
                    <option value="3">3 hours</option>
                    <option value="6">6 hours</option>
                </select>
            </label>
        </div>
        <label class="block p-3">
            <span class="block text-[10px] font-bold uppercase text-neutral-800">Visit</span>
            <select wire:model="experienceType" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-900 focus:ring-0">
                <option value="Incall">Incall</option>
                <option value="Outcall">Outcall</option>
            </select>
        </label>
    </div>
    @error('appointmentDate') <p class="mb-3 text-xs text-red-600">{{ $message }}</p> @enderror
    @if ($requested)
        <p class="mb-3 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-800">Request sent. It is on the specialist dashboard.</p>
    @endif
    <button wire:click="requestBooking" wire:loading.attr="disabled" class="mb-3 w-full rounded-lg bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60">
        <span wire:loading.remove>Reserve</span>
        <span wire:loading>Sending...</span>
    </button>
    <p class="mb-4 text-center text-xs text-neutral-500">You will not be charged yet</p>
    <div class="border-t border-neutral-200 pt-3 text-sm text-neutral-800">
        <div class="flex justify-between py-1"><span>Rate</span><span>UGX {{ number_format($escort->rateAmount()) }}</span></div>
        <div class="flex justify-between py-1"><span>Service fee</span><span>UGX {{ number_format($this->serviceFee) }}</span></div>
        <div class="mt-2 flex justify-between border-t border-neutral-200 pt-3 font-semibold"><span>Total</span><span>UGX {{ number_format($this->total) }}</span></div>
    </div>
</aside>
