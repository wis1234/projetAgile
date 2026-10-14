<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\Ai\AiProviderManager;
use App\Services\Ai\AiSettingsService;
use App\Services\Ai\AiUnavailableException;
use App\Services\Quiz\QuizAiGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/** Correction d'une copie par l'IA, depuis la page de correction (bouton « Corriger avec l'IA »). */
class QuizAiGradingController extends Controller
{
    public function __construct(
        private QuizAiGradingService $aiGrading,
        private AiSettingsService $settings,
        private AiProviderManager $providers,
    ) {
    }

    /** Capacité disponible ? (interrupteur admin, utilisateur autorisé, au moins un modèle configuré) */
    public function capability(): array
    {
        $user = Auth::user();

        if (!$this->settings->quizGradingEnabled()) {
            return ['available' => false, 'reason' => "La correction par l'IA est désactivée par un administrateur."];
        }
        if (!$this->settings->enabledFor($user)) {
            return ['available' => false, 'reason' => "L'accès à l'assistant IA est désactivé pour votre compte."];
        }
        if (!$this->providers->configured()) {
            return ['available' => false, 'reason' => "Aucun modèle d'IA n'est configuré."];
        }

        return ['available' => true, 'remaining' => $this->settings->gradingRemainingFor($user), 'strictness' => array_keys(QuizAiGradingService::STRICTNESS)];
    }

    /**
     * POST /projects/{project}/quizzes/{quiz}/grading/{attempt}/ai
     * apply=true  : corrige ET enregistre la copie (comportement du bouton).
     * apply=false : propose seulement les notes (rien n'est enregistré), pour les relire avant validation.
     */
    public function grade(Request $request, Project $project, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);
        $user = Auth::user();

        $cap = $this->capability();
        if (!$cap['available']) {
            return response()->json(['ok' => false, 'message' => $cap['reason']], 403);
        }
        if ($quiz->isValidated()) {
            return response()->json(['ok' => false, 'message' => 'Les résultats ont été validés en délibération : la correction est verrouillée.'], 423);
        }
        abort_unless((int) $attempt->quiz_id === (int) $quiz->id, 404);

        if ($cap['remaining'] <= 0) {
            return response()->json(['ok' => false, 'code' => 'quota', 'message' => "Vous avez atteint votre limite quotidienne de {$this->settings->quizGradingLimit()} copies corrigées par l'IA."], 429);
        }

        $options = $request->validate([
            'strictness' => ['nullable', 'in:' . implode(',', array_keys(QuizAiGradingService::STRICTNESS))],
            'instructions' => ['nullable', 'string', 'max:1000'],
            'apply' => ['nullable', 'boolean'],
        ]);
        $apply = (bool) ($options['apply'] ?? true);

        @set_time_limit(240);

        try {
            if ($apply) {
                $outcome = $this->aiGrading->gradeAndSave($quiz, $attempt, $user, $options);
                if (!$outcome['ok']) {
                    $code = $outcome['status'] === 'locked' ? 409 : ($outcome['status'] === 'not_found' ? 404 : 503);

                    return response()->json(['ok' => false, 'code' => $outcome['status'], 'message' => $outcome['message']], $code);
                }
                $proposal = $outcome['proposal'];
            } else {
                $reason = null;
                $proposal = $this->aiGrading->proposeLogged($quiz, $attempt, $user, $options, fn () => $this->aiGrading->propose($quiz, $attempt, $options), $reason);
                if ($proposal === null) {
                    return response()->json(['ok' => false, 'code' => 'failed', 'message' => $reason], 503);
                }
            }
        } catch (ValidationException $e) {
            return response()->json(['ok' => false, 'message' => collect($e->errors())->flatten()->first() ?: 'Données refusées.'], 422);
        } catch (HttpExceptionInterface $e) {
            // 409 : copie réservée par un autre correcteur, 423 : quiz validé…
            return response()->json(['ok' => false, 'message' => $e->getMessage() ?: 'Action refusée.'], $e->getStatusCode());
        } catch (AiUnavailableException $e) {
            return response()->json(['ok' => false, 'code' => $e->errorCode, 'message' => $e->getMessage()], 503);
        }

        return response()->json([
            'ok' => true,
            'applied' => $apply,
            'grades' => $proposal['grades'],
            'summary' => $proposal['summary'],
            'provider' => $proposal['provider'],
            'model' => $proposal['model'],
            'remaining' => $this->settings->gradingRemainingFor($user),
        ]);
    }
}
