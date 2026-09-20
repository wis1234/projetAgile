<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($request->user()->homeUrl());
        }

        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            report($e);

            return back()->with('error', 'L\'e-mail n\'a pas pu être envoyé. Réessayez dans quelques minutes.');
        }

        return back()
            ->with('status', 'verification-link-sent')
            ->with('success', 'Un nouveau lien de vérification vient de vous être envoyé.');
    }
}
