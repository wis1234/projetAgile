<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuizQuestionRequest;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Services\Quiz\QuizBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Enregistrement question par question (bouton « Enregistrer » sous chaque question).
 * Réponses JSON : la page ne se recharge pas, le formulaire en cours n'est pas perdu.
 */
class QuizQuestionController extends Controller
{
    public function __construct(private QuizBuilderService $builder)
    {
    }

    private function present(QuizQuestion $q): array
    {
        return [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'question_type' => $q->question_type,
            'option_a' => $q->option_a ?? '',
            'option_b' => $q->option_b ?? '',
            'option_c' => $q->option_c ?? '',
            'option_d' => $q->option_d ?? '',
            'correct_answer' => $q->correct_answer ?? 0,
            'order' => $q->order,
        ];
    }

    public function store(QuizQuestionRequest $request, Project $project, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', [$quiz, $project]);

        $question = $this->builder->createQuestion($quiz, $request->validated());

        return response()->json([
            'question' => $this->present($question),
            'quiz_type' => $quiz->fresh()->quiz_type,
            'message' => 'Question enregistrée.',
        ], 201);
    }

    public function update(QuizQuestionRequest $request, Project $project, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->authorize('update', [$quiz, $project]);

        $question = $this->builder->updateQuestion($quiz, $question, $request->validated());

        return response()->json([
            'question' => $this->present($question),
            'quiz_type' => $quiz->fresh()->quiz_type,
            'message' => 'Question mise à jour.',
        ]);
    }

    public function destroy(Project $project, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->authorize('update', [$quiz, $project]);

        $this->builder->deleteQuestion($quiz, $question);

        return response()->json(['message' => 'Question supprimée.']);
    }

    public function reorder(Request $request, Project $project, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', [$quiz, $project]);

        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $this->builder->reorder($quiz, $data['ids']);

        return response()->json(['message' => 'Ordre enregistré.']);
    }
}
