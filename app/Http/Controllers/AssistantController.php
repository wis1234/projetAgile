<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\AiPendingAction;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\AssistantService;
use App\Services\Ai\AssistantTools;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function __construct(private AssistantService $assistant)
    {
    }

    /** Page plein écran (mobile / lien direct). */
    public function index()
    {
        return Inertia::render('Assistant/Index');
    }

    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'string', 'max:200'],
        ], [
            'message.required' => 'Écrivez votre message.',
            'message.max' => 'Message trop long (2000 caractères maximum).',
        ]);

        // Le contexte de page n'est qu'une indication : on n'accepte qu'un chemin interne
        $page = isset($data['page']) && str_starts_with($data['page'], '/') && !str_starts_with($data['page'], '//') ? $data['page'] : null;

        try {
            $result = $this->assistant->reply($request->user(), $data['conversation_id'] ?? null, trim($data['message']), ['page' => $page]);
        } catch (AiUnavailableException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return response()->json($result);
    }

    public function conversations(Request $request): JsonResponse
    {
        $rows = AiConversation::where('user_id', $request->user()->id)->orderByDesc('updated_at')->limit(30)->get(['id', 'title', 'updated_at']);
        return response()->json(['conversations' => $rows, 'remaining' => $this->assistant->remaining($request->user())]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $messages = $conversation->messages()->orderByDesc('id')->limit(80)->get()->reverse()->values();

        // Statut courant des demandes de confirmation affichées
        $pendingIds = $messages->flatMap(fn ($m) => collect($m->actions ?? [])->where('type', 'confirm')->pluck('pending_id'))->unique()->all();
        $statuses = $pendingIds ? AiPendingAction::whereIn('id', $pendingIds)->pluck('status', 'id') : collect();

        return response()->json([
            'conversation' => ['id' => $conversation->id, 'title' => $conversation->title],
            'messages' => $messages->map(fn ($m) => [
                'id' => $m->id,
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => $m->created_at?->toIso8601String(),
                'actions' => collect($m->actions ?? [])->map(function ($a) use ($statuses) {
                    if (($a['type'] ?? null) === 'confirm') {
                        $a['status'] = $statuses[$a['pending_id']] ?? 'expired';
                    }
                    return $a;
                })->all(),
            ]),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        AiConversation::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }

    /** Confirmation explicite d'une action sensible proposée par l'assistant. */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $pending = AiPendingAction::where('user_id', $user->id)->findOrFail($id);

        if ($pending->expires_at->isPast()) {
            $pending->update(['status' => 'expired']);
            return response()->json(['ok' => false, 'status' => 'expired', 'message' => 'Cette demande a expiré. Redemandez-la à l\'assistant.'], 410);
        }
        // Verrou atomique : un double clic ne l'exécute qu'une fois
        $claimed = AiPendingAction::whereKey($pending->id)->where('status', 'pending')->update(['status' => 'confirmed']);
        if (!$claimed) {
            return response()->json(['ok' => false, 'status' => $pending->fresh()->status, 'message' => 'Cette demande a déjà été traitée.'], 409);
        }

        $outcome = (new AssistantTools($user))->runConfirmed($pending->fresh());
        return response()->json(['ok' => (bool) ($outcome['ok'] ?? false), 'status' => 'confirmed', 'message' => $outcome['message'] ?? 'Terminé.']);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $pending = AiPendingAction::where('user_id', $request->user()->id)->findOrFail($id);
        AiPendingAction::whereKey($pending->id)->where('status', 'pending')->update(['status' => 'cancelled']);
        return response()->json(['ok' => true, 'status' => 'cancelled']);
    }
}
