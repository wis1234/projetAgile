<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DeviceTokenController extends Controller
{
    /**
     * Enregistre (ou met à jour) le token FCM envoyé par le plugin
     * @capacitor/push-notifications côté client, après un événement
     * `registration` (voir PushNotificationManager côté React).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|max:512',
            'platform' => ['required', Rule::in(['android', 'ios', 'web'])],
            'device_name' => 'nullable|string|max:255',
        ]);

        // Si un autre utilisateur avait déjà ce token (ex: appareil partagé,
        // ré-installation), on le réattribue à l'utilisateur courant.
        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => Auth::id(),
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'last_used_at' => now(),
            ]
        );

        return response()->json(['success' => true, 'id' => $deviceToken->id]);
    }

    /**
     * Supprime le token à la déconnexion, pour ne plus recevoir de push
     * sur un appareil dont l'utilisateur s'est explicitement déconnecté.
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|max:512',
        ]);

        DeviceToken::where('token', $validated['token'])
            ->where('user_id', Auth::id())
            ->delete();

        return response()->json(['success' => true]);
    }
}