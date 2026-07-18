<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PushSubscriptionController extends Controller
{
    /**
     * Enregistrer un nouvel abonnement push pour l'utilisateur connecté.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint'                       => 'required|url',
            'keys.p256dh'                    => 'required|string',
            'keys.auth'                      => 'required|string',
            'expirationTime'                 => 'nullable',
        ]);

        $user = $request->user();

        // Upsert : met à jour si l'endpoint existe déjà, sinon crée
        PushSubscription::updateOrCreate(
            ['endpoint' => $request->endpoint],
            [
                'user_id'          => $user?->id,
                'public_key'       => $request->input('keys.p256dh'),
                'auth_token'       => $request->input('keys.auth'),
                'content_encoding' => 'aesgcm',
            ]
        );

        return response()->json(['status' => 'subscribed'], 201);
    }

    /**
     * Supprimer un abonnement (désabonnement).
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => 'required|url']);

        PushSubscription::where('endpoint', $request->endpoint)->delete();

        return response()->json(['status' => 'unsubscribed'], 200);
    }

    /**
     * Endpoint de test pour envoyer une notification push à l'utilisateur connecté.
     * (Utile pour déboguer, à supprimer en production)
     */
    public function test(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $subscriptions = PushSubscription::where('user_id', $user->id)->get();

        if ($subscriptions->isEmpty()) {
            return response()->json(['error' => 'Aucun abonnement trouvé'], 404);
        }

        app(\App\Services\WebPushService::class)->sendToUser($user, [
            'title' => '🎉 Test ProJA !',
            'body'  => 'Vos notifications push fonctionnent parfaitement.',
            'url'   => '/dashboard',
            'icon'  => '/logo-proja.png',
        ]);

        return response()->json(['status' => 'notification envoyée', 'count' => $subscriptions->count()]);
    }
}
