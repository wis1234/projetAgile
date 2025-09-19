<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        try {
            $this->authorize('view', $request->user());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request)
    {
        try {
            $this->authorize('update', $request->user());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        
        $user = $request->user();
        $data = $request->validated();

        // Gestion de la photo de profil
        if ($request->hasFile('profile_photo')) {
            try {
                // Supprimer l'ancienne photo si elle existe et n'est pas l'avatar par défaut
                if ($user->profile_photo_path && 
                    !str_contains($user->profile_photo_path, 'ui-avatars.com') &&
                    Storage::disk('public')->exists($user->profile_photo_path)) {
                    Storage::disk('public')->delete($user->profile_photo_path);
                }
                
                // Stocker la nouvelle photo
                $path = $request->file('profile_photo')->store('profile-photos', 'public');
                $data['profile_photo_path'] = $path;
            } catch (\Exception $e) {
                \Log::error('Erreur lors de la mise à jour de la photo de profil : ' . $e->getMessage());
                return back()->withErrors(['profile_photo' => 'Une erreur est survenue lors du téléchargement de la photo.']);
            }
        }

        // Mise à jour des champs du profil
        $user->fill($data);
        
        // Réinitialiser la vérification d'email si l'email a changé
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
            $user->sendEmailVerificationNotification();
        }
        
        try {
            $user->save();
            return back()->with([
                'success' => 'Profil mis à jour avec succès',
                'user' => $user->only(['id', 'name', 'email', 'profile_photo_path', 'profile_photo_url'])
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du profil : ' . $e->getMessage());
            return back()->withErrors(['error' => 'Une erreur est survenue lors de la mise à jour du profil.']);
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Show the user's bank details form.
     */
    public function showBankDetails(Request $request)
    {
        try {
            $this->authorize('view', $request->user());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $user = $request->user();
        
        return Inertia::render('Profile/BankDetails', [
            'bankDetails' => [
                'bank_name' => $user->bank_name,
                'account_holder_name' => $user->account_holder_name,
                'account_number' => $user->account_number,
                'iban' => $user->iban,
                'swift_code' => $user->swift_code,
            ]
        ]);
    }

    /**
     * Update the user's bank details.
     */
    public function updateBankDetails(Request $request)
    {
        try {
            $this->authorize('update', $request->user());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validator = Validator::make($request->all(), [
            'bank_name' => ['required', 'string', 'max:255'],
            'account_holder_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50'],
            'iban' => ['required', 'string', 'max:34'],
            'swift_code' => ['required', 'string', 'max:11'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = $request->user();
        $user->update($validator->validated());

        return back()->with('status', 'bank-details-updated');
    }
}
