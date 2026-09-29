<?php

namespace App\Http\Controllers;

use App\Models\EscortReference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ReferenceConfirmationController extends Controller
{
    public function show(string $token): View
    {
        $reference = EscortReference::query()->where('verification_token', $token)->firstOrFail();
        $reference->load('escort');

        return view('pages.reference-confirm', ['reference' => $reference]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $reference = EscortReference::query()->where('verification_token', $token)->firstOrFail();

        if ($reference->status !== EscortReference::NOT_CONFIRMED) {
            return redirect()->route('references.confirm', $token);
        }

        $choice = $request->validate([
            'answer' => ['required', 'in:yes,no'],
        ])['answer'];

        $reference->update([
            'status' => $choice === 'yes' ? EscortReference::CONFIRMED : EscortReference::REJECTED,
            'verified_at' => $choice === 'yes' ? now() : null,
        ]);

        return redirect()
            ->route('references.confirm', $token)
            ->with('status', $choice === 'yes' ? 'Thank you. The reference is confirmed.' : 'Thank you. We recorded that you do not know this work.');
    }
}
