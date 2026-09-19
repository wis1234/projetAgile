<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Services\Quiz\QuizDeliberationService;
use App\Services\Quiz\QuizScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuizDeliberationController extends Controller
{
    public function __construct(
        private QuizDeliberationService $deliberation,
        private QuizScoringService $scoring,
    ) {
    }

    public function show(Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $final = $this->scoring->finalResults($quiz, true);
        $summary = $this->deliberation->summary($quiz, Auth::user());

        return Inertia::render('Quizzes/Deliberation', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'quiz_type' => $quiz->quiz_type,
                'deliberation_status' => $quiz->deliberation_status,
            ],
            'deliberation' => $summary,
            'rankings' => $final['rows'],
            'stats' => $final['stats'],
            'passMark' => QuizScoringService::passMark(),
            'canReopen' => Auth::user()->hasRole('admin') || $quiz->created_by === Auth::id(),
        ]);
    }

    /** Ouvre la délibération (toutes les copies doivent être corrigées). */
    public function open(Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $this->deliberation->open($quiz, Auth::user());

        if (function_exists('activity_log')) {
            activity_log('update', "Délibération ouverte pour le quiz '{$quiz->title}' par " . Auth::user()->name, $quiz);
        }

        return redirect()->route('projects.quizzes.deliberation', [$project->id, $quiz->id])
            ->with('success', 'La délibération est ouverte : chaque responsable doit donner son aval.');
    }

    /** Aval d'un responsable, confirmé par son mot de passe ProJA. */
    public function approve(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate([
            'password' => ['required', 'string'],
        ], [
            'password.required' => 'Saisissez votre mot de passe pour donner votre aval.',
        ]);

        $quiz = $this->deliberation->approve($quiz, Auth::user(), $data['password'], $request);

        if (function_exists('activity_log')) {
            activity_log('update', Auth::user()->name . " a donné son aval pour le quiz '{$quiz->title}'", $quiz);
        }

        return redirect()->route('projects.quizzes.deliberation', [$project->id, $quiz->id])
            ->with('success', $quiz->isValidated()
                ? 'Tous les responsables ont donné leur aval : les résultats sont validés.'
                : 'Votre aval a bien été enregistré.');
    }

    public function reopen(Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        abort_unless(Auth::user()->hasRole('admin') || $quiz->created_by === Auth::id(), 403, 'Seul le concepteur du quiz ou un administrateur peut rouvrir la délibération.');

        $this->deliberation->reopen($quiz, Auth::user());

        return redirect()->route('projects.quizzes.deliberation', [$project->id, $quiz->id])
            ->with('success', 'Délibération rouverte : les avals ont été réinitialisés.');
    }
}
