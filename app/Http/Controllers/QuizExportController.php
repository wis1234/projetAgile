<?php

namespace App\Http\Controllers;

use App\Exports\QuizCumulExport;
use App\Exports\QuizResultsExport;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizCumul;
use App\Services\Quiz\QuizCumulService;
use App\Services\Quiz\QuizScoringService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Exports Excel / PDF des résultats finaux d'un quiz et des quiz cumulés.
 */
class QuizExportController extends Controller
{
    public function __construct(
        private QuizScoringService $scoring,
        private QuizCumulService $cumuls,
    ) {
    }

    public function quiz(Project $project, Quiz $quiz, string $format)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $final = $this->scoring->finalResults($quiz, true);

        $approvers = $quiz->isValidated()
            ? $quiz->approvals()->with('user:id,name')->orderBy('approved_at')->get()
                ->map(fn ($a) => ['name' => $a->user?->name, 'approved_at' => $a->approved_at->format('d/m/Y à H:i')])->all()
            : [];

        $meta = [
            'title' => $quiz->title,
            'project' => $project->name,
            'generated_at' => now()->format('d/m/Y H:i'),
            'validated' => $quiz->isValidated(),
            'status_label' => $quiz->isValidated()
                ? 'Résultats officiels — validés le ' . $quiz->validated_at->format('d/m/Y à H:i')
                : 'Résultats provisoires (délibération non terminée)',
            'approvers' => $approvers,
        ];

        $file = 'resultats-' . Str::slug($quiz->title) . '-' . now()->format('Ymd');

        if ($format === 'xlsx') {
            return Excel::download(new QuizResultsExport($meta, $final['rows'], $final['stats']), $file . '.xlsx');
        }

        return Pdf::loadView('exports.quiz-results-pdf', [
            'meta' => $meta,
            'rows' => $final['rows'],
            'stats' => $final['stats'],
        ])->setPaper('a4', 'portrait')->download($file . '.pdf');
    }

    public function cumul(Project $project, QuizCumul $quizCumul, string $format)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $this->cumuls->computeForCumul($quizCumul);
        $notValidated = collect($data['quizzes'])->where('validated', false)->count();

        $meta = [
            'title' => $quizCumul->title,
            'project' => $project->name,
            'generated_at' => now()->format('d/m/Y H:i'),
            'validated' => $notValidated === 0,
            'status_label' => $notValidated === 0
                ? 'Tous les quiz cumulés ont été validés en délibération'
                : $notValidated . ' quiz cumulé(s) non encore validé(s) en délibération : résultats provisoires',
        ];

        $file = 'resultats-cumules-' . Str::slug($quizCumul->title) . '-' . now()->format('Ymd');

        if ($format === 'xlsx') {
            return Excel::download(new QuizCumulExport($meta, $data), $file . '.xlsx');
        }

        return Pdf::loadView('exports.quiz-cumul-pdf', ['meta' => $meta, 'data' => $data])
            ->setPaper('a4', 'landscape')
            ->download($file . '.pdf');
    }
}
