<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizCumul;
use App\Services\Quiz\QuizCumulService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Cumul de plusieurs quiz : sélection, aperçu du calcul, création, résultats cumulés.
 */
class QuizCumulController extends Controller
{
    public function __construct(private QuizCumulService $cumuls)
    {
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'missing_policy' => ['required', 'in:zero,ignore'],
            'include_bonus' => ['boolean'],
            'items' => ['required', 'array', 'min:2'],
            'items.*.quiz_id' => ['required', 'integer', 'distinct'],
            'items.*.coefficient' => ['required', 'numeric', 'min:0.01', 'max:100'],
        ];
    }

    private function messages(): array
    {
        return [
            'items.required' => 'Sélectionnez au moins deux quiz à cumuler.',
            'items.min' => 'Sélectionnez au moins deux quiz à cumuler.',
            'title.required' => 'Donnez un nom au quiz cumulé.',
        ];
    }

    public function create(Project $project)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        return Inertia::render('Quizzes/CumulCreate', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'quizzes' => $this->cumuls->selectableQuizzes($project),
            'cap' => (float) config('quiz.participation_cap', 10),
        ]);
    }

    /** Aperçu instantané (sans rien enregistrer). */
    public function preview(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate([
            'missing_policy' => ['required', 'in:zero,ignore'],
            'include_bonus' => ['boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.quiz_id' => ['required', 'integer'],
            'items.*.coefficient' => ['required', 'numeric', 'min:0.01', 'max:100'],
        ]);

        $result = $this->cumuls->compute($project, $data['items'], $data['missing_policy'], (bool) ($data['include_bonus'] ?? true));

        return response()->json($result);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate($this->rules(), $this->messages());

        $ids = collect($data['items'])->pluck('quiz_id');
        $valid = Quiz::where('project_id', $project->id)->where('is_draft', false)->whereIn('id', $ids)->pluck('id');

        if ($valid->count() !== $ids->count()) {
            throw ValidationException::withMessages(['items' => 'Certains quiz sélectionnés n\'appartiennent pas à ce projet.']);
        }

        $preview = $this->cumuls->compute($project, $data['items'], $data['missing_policy'], (bool) ($data['include_bonus'] ?? true));

        if (!empty($preview['blocking'])) {
            throw ValidationException::withMessages([
                'items' => 'Des copies restent à corriger dans : ' . implode(', ', $preview['blocking']) . '.',
            ]);
        }

        $cumul = DB::transaction(function () use ($data, $project) {
            $cumul = QuizCumul::create([
                'project_id' => $project->id,
                'created_by' => Auth::id(),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'missing_policy' => $data['missing_policy'],
                'include_bonus' => (bool) ($data['include_bonus'] ?? true),
            ]);

            foreach ($data['items'] as $item) {
                $cumul->items()->create([
                    'quiz_id' => $item['quiz_id'],
                    'coefficient' => $item['coefficient'],
                ]);
            }

            return $cumul;
        });

        if (function_exists('activity_log')) {
            activity_log('create', "Quiz cumulé '{$cumul->title}' créé (" . count($data['items']) . ' quiz)', $project);
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz cumulé créé avec succès !');
    }

    public function show(Project $project, QuizCumul $quizCumul)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $computed = $this->cumuls->computeForCumul($quizCumul);

        return Inertia::render('Quizzes/CumulShow', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'cumul' => [
                'id' => $quizCumul->id,
                'title' => $quizCumul->title,
                'description' => $quizCumul->description,
                'missing_policy' => $quizCumul->missing_policy,
                'include_bonus' => $quizCumul->include_bonus,
                'created_at' => $quizCumul->created_at,
            ],
            'quizzes' => $computed['quizzes'],
            'rows' => $computed['rows'],
            'stats' => $computed['stats'],
            'method' => $computed['method'],
            'blocking' => array_values($computed['blocking']),
        ]);
    }

    public function destroy(Project $project, QuizCumul $quizCumul)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $title = $quizCumul->title;
        $quizCumul->delete();

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', "Quiz cumulé « {$title} » supprimé.");
    }
}
