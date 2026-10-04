<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\AiPendingAction;
use App\Models\AiUsage;
use App\Models\AiUserSetting;
use App\Models\User;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\AudioTranscriptionService;
use App\Services\Ai\AiSettingsService;
use App\Services\Ai\AssistantService;
use App\Services\Ai\AssistantTools;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function __construct(private AssistantService $assistant)
    {
    }

    public function admin(AiSettingsService $settings, AudioTranscriptionService $transcription)
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $today = now()->toDateString();
        $global = $settings->global();
        $providers = $settings->providers();
        $users = User::query()->orderBy('name')->limit(500)->get(['id', 'name', 'email']);
        $userSettings = AiUserSetting::whereIn('user_id', $users->pluck('id'))->get()->keyBy('user_id');
        $usageByUser = AiUsage::query()->where('kind', 'chat')->whereDate('created_at', $today)
            ->select('user_id', DB::raw('count(*) as requests_today'))
            ->groupBy('user_id')->pluck('requests_today', 'user_id');

        return Inertia::render('Assistant/Admin', [
            'settings' => [
                'enabled' => $global->enabled,
                'daily_limit' => $global->daily_limit,
                'max_tokens' => $global->max_tokens,
                'timeout' => $global->timeout,
                'provider_order' => $settings->providerOrder(),
                'enabled_providers' => $settings->enabledProviderNames(),
            ],
            'providers' => collect($providers)->map(fn ($provider, $name) => [
                'name' => $name,
                'model' => $provider['model'],
                'available' => $provider['available'],
            ])->values(),
            'transcriptionProviders' => $transcription->configuredProviders(),
            'stats' => [
                'requests_today' => AiUsage::whereDate('created_at', $today)->count(),
                'transcriptions_today' => AiUsage::where('kind', 'transcription')->whereDate('created_at', $today)->count(),
                'success_today' => AiUsage::whereDate('created_at', $today)->where('status', 'success')->count(),
                'errors_today' => AiUsage::whereDate('created_at', $today)->where('status', 'failed')->count(),
                'requests_7d' => AiUsage::where('created_at', '>=', now()->subDays(6)->startOfDay())->count(),
            ],
            'users' => $users->map(function ($user) use ($userSettings, $usageByUser, $global) {
                $setting = $userSettings->get($user->id);
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'enabled' => $setting?->enabled ?? true,
                    'daily_limit' => $setting?->daily_limit,
                    'effective_limit' => $setting?->daily_limit ?? $global->daily_limit,
                    'requests_today' => (int) ($usageByUser[$user->id] ?? 0),
                ];
            }),
        ]);
    }

    public function updateAdminSettings(Request $request, AiSettingsService $settings): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'daily_limit' => ['required', 'integer', 'min:0', 'max:10000'],
            'max_tokens' => ['required', 'integer', 'min:128', 'max:32000'],
            'timeout' => ['required', 'integer', 'min:10', 'max:300'],
            'provider_order' => ['required', 'array', 'min:1'],
            'provider_order.*' => ['required', 'string', 'distinct', 'in:anthropic,groq,openrouter,ollama'],
            'enabled_providers' => ['present', 'array'],
            'enabled_providers.*' => ['required', 'string', 'distinct', 'in:anthropic,groq,openrouter,ollama'],
        ]);
        $validProviders = array_keys($settings->providers());
        abort_if(
            array_diff($validated['provider_order'], $validProviders)
                || array_diff($validated['enabled_providers'], $validProviders),
            422,
            'Fournisseur inconnu.'
        );
        $settings->updateGlobal($validated);

        return response()->json(['ok' => true, 'message' => 'Configuration IA enregistrée.']);
    }

    public function updateUserSetting(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);
        $validated = $request->validate([
            'daily_limit' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'enabled' => ['required', 'boolean'],
        ]);
        AiUserSetting::updateOrCreate(
            ['user_id' => $user->id],
            ['daily_limit' => $validated['daily_limit'], 'enabled' => $validated['enabled']]
        );

        return response()->json(['ok' => true, 'message' => 'Quota utilisateur enregistré.']);
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

    public function transcribe(Request $request, AudioTranscriptionService $transcription): JsonResponse
    {
        $user = $request->user();
        abort_unless($this->assistant->enabled() && app(AiSettingsService::class)->enabledFor($user), 503, 'L’assistant IA est désactivé.');
        $data = $request->validate([
            'audio' => ['required', 'file', 'max:20480', 'mimes:webm,ogg,wav,mp3,mpga,m4a,mp4,aac'],
        ]);

        $usage = AiUsage::create(['user_id' => $user->id, 'kind' => 'transcription', 'status' => 'started']);
        $startedAt = microtime(true);
        try {
            $result = $transcription->transcribe($data['audio']);
            $usage->update([
                'provider' => $result['provider'],
                'model' => $result['model'],
                'status' => 'success',
                'duration_ms' => (int) ((microtime(true) - $startedAt) * 1000),
            ]);
        } catch (AiUnavailableException $e) {
            $usage->update([
                'status' => 'failed',
                'duration_ms' => (int) ((microtime(true) - $startedAt) * 1000),
                'failure_reason' => mb_substr($e->getMessage(), 0, 500),
            ]);
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return response()->json(['text' => $result['text'], 'provider' => $result['provider']]);
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
