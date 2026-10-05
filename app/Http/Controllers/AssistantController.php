<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\AiPendingAction;
use App\Models\AiUsage;
use App\Models\AiUserSetting;
use App\Models\User;
use App\Services\Ai\AiProviderManager;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\AudioTranscriptionService;
use App\Services\Ai\AiSettingsService;
use App\Services\Ai\AssistantService;
use App\Services\Ai\AssistantTools;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function __construct(private AssistantService $assistant)
    {
    }

    /** Accès réservé aux administrateurs (Gate admin-only ou rôle admin, y compris Spatie). */
    private function authorizeAdmin(?User $user): void
    {
        abort_unless(
            $user && ($user->can('admin-only') || $user->hasAdminAccess()),
            403
        );
    }

    // ───────────────────────── Tableau de bord administrateur ─────────────────────────

    /** Statistiques d'usage sur N jours (graphiques, fournisseurs, outils, utilisateurs, erreurs récentes). */
    private function buildStats(int $days): array
    {
        $days = in_array($days, [7, 14, 30, 90], true) ? $days : 14;
        $from = now()->subDays($days - 1)->startOfDay();
        $prevFrom = $from->copy()->subDays($days);

        $base = fn () => AiUsage::query()->where('created_at', '>=', $from);
        $chat = fn () => $base()->where('kind', 'chat');

        $success = (clone $chat())->where('status', 'success')->count();
        $failed = (clone $chat())->where('status', 'failed')->count();
        $blocked = (clone $chat())->where('status', 'blocked')->count();
        $requests = $success + $failed + $blocked;
        $prevRequests = AiUsage::where('kind', 'chat')->whereBetween('created_at', [$prevFrom, $from])->whereIn('status', ['success', 'failed', 'blocked'])->count();

        // Série journalière complète (jours sans activité = 0)
        $rows = $base()->selectRaw("DATE(created_at) as d, kind, status, COUNT(*) as c")->groupBy('d', 'kind', 'status')->get();
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $series[$d] = ['date' => $d, 'success' => 0, 'failed' => 0, 'voice' => 0];
        }
        foreach ($rows as $r) {
            $d = (string) $r->d;
            if (!isset($series[$d])) {
                continue;
            }
            if ($r->kind === 'chat') {
                $key = $r->status === 'success' ? 'success' : ($r->status === 'started' ? null : 'failed');
                if ($key) { $series[$d][$key] += (int) $r->c; }
            } elseif ($r->kind === 'transcription' && $r->status === 'success') {
                $series[$d]['voice'] += (int) $r->c;
            }
        }

        $byProvider = (clone $chat())->whereNotNull('provider')->where('status', 'success')
            ->selectRaw('provider, model, COUNT(*) as c, AVG(duration_ms) as avg_ms, SUM(COALESCE(input_tokens,0)) as tin, SUM(COALESCE(output_tokens,0)) as tout, SUM(fallbacks) as fb')
            ->groupBy('provider', 'model')->orderByDesc('c')->get()
            ->map(fn ($r) => ['provider' => $r->provider, 'model' => $r->model, 'requests' => (int) $r->c, 'avg_ms' => (int) $r->avg_ms, 'tokens_in' => (int) $r->tin, 'tokens_out' => (int) $r->tout]);

        // Outils : agrégation en PHP (indépendante du moteur SQL / JSON)
        $tools = [];
        foreach ((clone $chat())->whereNotNull('tools')->latest('id')->limit(4000)->pluck('tools') as $t) {
            foreach ((array) $t as $name => $n) {
                $tools[$name] = ($tools[$name] ?? 0) + (int) $n;
            }
        }
        arsort($tools);

        $topUsers = (clone $chat())->whereNotNull('user_id')->where('status', 'success')
            ->selectRaw('user_id, COUNT(*) as c, MAX(created_at) as last_at')->groupBy('user_id')->orderByDesc('c')->limit(8)->get();
        $names = User::whereIn('id', $topUsers->pluck('user_id'))->pluck('name', 'id');

        $errors = (clone $chat())->whereIn('status', ['failed', 'blocked'])->with('user:id,name')->latest('id')->limit(8)->get()
            ->map(fn ($u) => ['id' => $u->id, 'at' => $u->created_at?->toIso8601String(), 'user' => $u->user?->name, 'status' => $u->status,
                'reason' => $u->failure_reason, 'provider' => $u->provider, 'attempts' => $u->attempts]);

        $today = now()->startOfDay();
        return [
            'days' => $days,
            'totals' => [
                'requests' => $requests,
                'success' => $success,
                'failed' => $failed,
                'blocked' => $blocked,
                'success_rate' => ($success + $failed) ? round($success * 100 / ($success + $failed), 1) : null,
                'avg_ms' => (int) ((clone $chat())->where('status', 'success')->avg('duration_ms') ?? 0),
                'tokens_in' => (int) (clone $chat())->sum('input_tokens'),
                'tokens_out' => (int) (clone $chat())->sum('output_tokens'),
                'voice' => $base()->where('kind', 'transcription')->where('status', 'success')->count(),
                'via_voice' => (clone $chat())->where('via_voice', true)->where('status', 'success')->count(),
                'fallbacks' => (int) (clone $chat())->sum('fallbacks'),
                'active_users' => (clone $chat())->whereNotNull('user_id')->distinct('user_id')->count('user_id'),
                'conversations' => (clone $chat())->whereNotNull('conversation_id')->distinct('conversation_id')->count('conversation_id'),
                'trend_pct' => $prevRequests ? round(($requests - $prevRequests) * 100 / $prevRequests) : null,
            ],
            'today' => [
                'requests' => AiUsage::where('kind', 'chat')->where('created_at', '>=', $today)->whereIn('status', ['success', 'failed', 'blocked'])->count(),
                'errors' => AiUsage::where('kind', 'chat')->where('created_at', '>=', $today)->where('status', 'failed')->count(),
                'voice' => AiUsage::where('kind', 'transcription')->where('created_at', '>=', $today)->where('status', 'success')->count(),
            ],
            'series' => array_values($series),
            'by_provider' => $byProvider,
            'tools' => collect($tools)->take(10)->map(fn ($n, $k) => ['tool' => $k, 'count' => $n])->values(),
            'top_users' => $topUsers->map(fn ($r) => ['id' => $r->user_id, 'name' => $names[$r->user_id] ?? '—', 'requests' => (int) $r->c, 'last_at' => $r->last_at])->values(),
            'recent_errors' => $errors,
        ];
    }

    public function admin(AiSettingsService $settings, AudioTranscriptionService $transcription, AiProviderManager $manager)
    {
        $this->authorizeAdmin(auth()->user());

        $global = $settings->global();
        $startOfDay = now()->startOfDay();
        $users = User::query()->orderBy('name')->limit(500)->get(['id', 'name', 'email', 'profile_photo_path']);
        $userSettings = AiUserSetting::whereIn('user_id', $users->pluck('id'))->get()->keyBy('user_id');
        $todayByUser = AiUsage::query()->where('kind', 'chat')->whereIn('status', ['started', 'success'])->where('created_at', '>=', $startOfDay)
            ->select('user_id', DB::raw('count(*) as c'))->groupBy('user_id')->pluck('c', 'user_id');
        $weekByUser = AiUsage::query()->where('kind', 'chat')->where('status', 'success')->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select('user_id', DB::raw('count(*) as c'))->groupBy('user_id')->pluck('c', 'user_id');
        $lastUse = AiUsage::query()->where('kind', 'chat')->where('status', 'success')->select('user_id', DB::raw('max(created_at) as m'))->groupBy('user_id')->pluck('m', 'user_id');

        return Inertia::render('Assistant/Admin', [
            'settings' => [
                'enabled' => (bool) $global->enabled,
                'daily_limit' => (int) $global->daily_limit,
                'max_tokens' => (int) $global->max_tokens,
                'timeout' => (int) $global->timeout,
                'max_steps' => $settings->maxSteps(),
                'max_message_chars' => $settings->maxMessageChars(),
                'voice_enabled' => $settings->voiceEnabled(),
                'voice_daily_limit' => $settings->voiceLimit(),
                'files_read_enabled' => $settings->features()['files_read'],
                'files_write_enabled' => $settings->features()['files_write'],
                'members_manage_enabled' => $settings->features()['members'],
                'reports_enabled' => $settings->features()['reports'],
                'custom_instructions' => $settings->customInstructions(),
                'retention_days' => (int) ($global->retention_days ?: 180),
                'provider_order' => $settings->providerOrder(),
                'enabled_providers' => $settings->enabledProviderNames(),
            ],
            'providers' => $manager->health(),
            'transcriptionProviders' => $transcription->configuredProviders(),
            'stats' => $this->buildStats(14),
            'users' => $users->map(function ($user) use ($userSettings, $todayByUser, $weekByUser, $lastUse, $settings) {
                $setting = $userSettings->get($user->id);
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'photo' => $user->profile_photo_url,
                    'enabled' => $setting?->enabled ?? true,
                    'daily_limit' => $setting?->daily_limit,
                    'effective_limit' => $settings->limitFor($user),
                    'requests_today' => (int) ($todayByUser[$user->id] ?? 0),
                    'requests_7d' => (int) ($weekByUser[$user->id] ?? 0),
                    'last_used_at' => $lastUse[$user->id] ?? null,
                ];
            }),
        ]);
    }

    /** Rafraîchit les statistiques pour une autre période, sans recharger la page. */
    public function stats(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request->user());
        return response()->json($this->buildStats((int) $request->query('days', 14)));
    }

    public function testProvider(Request $request, string $name, AiProviderManager $manager): JsonResponse
    {
        $this->authorizeAdmin($request->user());
        abort_unless(array_key_exists($name, config('services.ai.providers', [])), 404);

        return response()->json($manager->ping($name) + ['providers' => $manager->health()]);
    }

    public function resetProvider(Request $request, string $name, AiProviderManager $manager): JsonResponse
    {
        $this->authorizeAdmin($request->user());
        abort_unless(array_key_exists($name, config('services.ai.providers', [])), 404);
        $manager->resetCircuit($name);

        return response()->json(['ok' => true, 'providers' => $manager->health()]);
    }

    public function purgeLogs(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request->user());
        $days = (int) $request->validate(['days' => ['required', 'integer', 'min:7', 'max:3650']])['days'];
        $deleted = AiUsage::where('created_at', '<', now()->subDays($days))->delete();

        return response()->json(['ok' => true, 'deleted' => $deleted, 'message' => "{$deleted} ligne(s) d'historique supprimée(s)."]);
    }

    public function updateAdminSettings(Request $request, AiSettingsService $settings): JsonResponse
    {
        $this->authorizeAdmin($request->user());
        $validProviders = array_keys($settings->providers());
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'daily_limit' => ['required', 'integer', 'min:0', 'max:10000'],
            'max_tokens' => ['required', 'integer', 'min:128', 'max:32000'],
            'timeout' => ['required', 'integer', 'min:10', 'max:300'],
            'max_steps' => ['sometimes', 'integer', 'min:1', 'max:15'],
            'max_message_chars' => ['sometimes', 'integer', 'min:200', 'max:8000'],
            'voice_enabled' => ['sometimes', 'boolean'],
            'voice_daily_limit' => ['sometimes', 'integer', 'min:0', 'max:5000'],
            'files_read_enabled' => ['sometimes', 'boolean'],
            'files_write_enabled' => ['sometimes', 'boolean'],
            'members_manage_enabled' => ['sometimes', 'boolean'],
            'reports_enabled' => ['sometimes', 'boolean'],
            'custom_instructions' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'retention_days' => ['sometimes', 'integer', 'min:7', 'max:3650'],
            'provider_order' => ['required', 'array', 'min:1'],
            'provider_order.*' => ['required', 'string', 'distinct', Rule::in($validProviders)],
            'enabled_providers' => ['present', 'array'],
            'enabled_providers.*' => ['required', 'string', 'distinct', Rule::in($validProviders)],
        ]);
        $settings->updateGlobal($validated);

        return response()->json(['ok' => true, 'message' => 'Configuration IA enregistrée.']);
    }

    public function updateUserSetting(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request->user());
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
        $maxChars = app(AiSettingsService::class)->maxMessageChars();
        $data = $request->validate([
            'message' => ['required', 'string', 'max:' . $maxChars],
            'conversation_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'string', 'max:200'],
            'voice' => ['nullable', 'boolean'],
        ], [
            'message.required' => 'Écrivez votre message.',
            'message.max' => "Message trop long ({$maxChars} caractères maximum).",
        ]);

        // Le contexte de page n'est qu'une indication : on n'accepte qu'un chemin interne
        $page = isset($data['page']) && str_starts_with($data['page'], '/') && !str_starts_with($data['page'], '//') ? $data['page'] : null;

        try {
            $result = $this->assistant->reply($request->user(), $data['conversation_id'] ?? null, trim($data['message']), ['page' => $page], (bool) ($data['voice'] ?? false));
        } catch (AiUnavailableException $e) {
            $status = match ($e->errorCode) { 'quota' => 429, 'too_long' => 422, default => 503 };
            return response()->json(['message' => $e->getMessage(), 'code' => $e->errorCode], $status);
        }

        return response()->json($result);
    }

    public function transcribe(Request $request, AudioTranscriptionService $transcription): JsonResponse
    {
        $user = $request->user();
        $aiSettings = app(AiSettingsService::class);
        abort_unless($this->assistant->enabled() && $aiSettings->enabledFor($user), 503, 'L’assistant IA est désactivé.');
        if (!$aiSettings->voiceEnabled()) {
            return response()->json(['message' => 'La saisie vocale est désactivée par un administrateur.'], 403);
        }
        if ($aiSettings->voiceRemainingFor($user) <= 0) {
            return response()->json(['message' => "Vous avez atteint votre limite quotidienne de {$aiSettings->voiceLimit()} messages vocaux."], 429);
        }
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

        $outcome = (new AssistantTools($user, app(AiSettingsService::class)->features()))->runConfirmed($pending->fresh());
        return response()->json(['ok' => (bool) ($outcome['ok'] ?? false), 'status' => 'confirmed', 'message' => $outcome['message'] ?? 'Terminé.']);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $pending = AiPendingAction::where('user_id', $request->user()->id)->findOrFail($id);
        AiPendingAction::whereKey($pending->id)->where('status', 'pending')->update(['status' => 'cancelled']);
        return response()->json(['ok' => true, 'status' => 'cancelled']);
    }
}
