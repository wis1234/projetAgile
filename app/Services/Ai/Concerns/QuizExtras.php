<?php

namespace App\Services\Ai\Concerns;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\User;
use App\Services\Quiz\QuizScoringService;

trait QuizExtras
{
    public static function quizDefinitions(): array
    {
        $int = ['type' => 'integer'];
        $str = ['type' => 'string'];
        
        return [
            [
                'name' => 'list_quizzes',
                'description' => "Liste les quiz d'un projet.",
                'input_schema' => ['type' => 'object', 'properties' => ['project_id' => $int], 'required' => ['project_id']],
            ],
            [
                'name' => 'get_quiz',
                'description' => "Récupère les détails d'un quiz, y compris ses questions et statistiques.",
                'input_schema' => ['type' => 'object', 'properties' => ['quiz_id' => $int], 'required' => ['quiz_id']],
            ],
            [
                'name' => 'create_quiz',
                'description' => "Crée un nouveau quiz.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int,
                    'title' => $str,
                    'description' => $str,
                    'duration_minutes' => $int
                ], 'required' => ['project_id', 'title']],
            ],
            [
                'name' => 'update_quiz',
                'description' => "Met à jour un quiz.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'quiz_id' => $int,
                    'title' => $str,
                    'description' => $str,
                    'duration_minutes' => $int
                ], 'required' => ['quiz_id']],
            ],
            [
                'name' => 'add_quiz_candidate',
                'description' => "Ajoute un candidat à un quiz.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'quiz_id' => $int,
                    'user_id' => $int
                ], 'required' => ['quiz_id', 'user_id']],
            ],
            [
                'name' => 'get_quiz_attempt_to_grade',
                'description' => "Récupère les réponses d'un candidat pour correction (questions + réponses fournies). Utile pour évaluer la copie.",
                'input_schema' => ['type' => 'object', 'properties' => ['attempt_id' => $int], 'required' => ['attempt_id']],
            ],
            [
                'name' => 'submit_quiz_grades',
                'description' => "Enregistre les notes attribuées par l'assistant à une copie.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'attempt_id' => $int,
                    'grades' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'response_id' => $int,
                                'score' => $int,
                                'comment' => $str
                            ],
                            'required' => ['response_id', 'score']
                        ]
                    ]
                ], 'required' => ['attempt_id', 'grades']],
            ],
        ];
    }
    
    private function resolveQuizForAccess(int $quizId): array
    {
        $quiz = Quiz::with('project')->find($quizId);
        if (!$quiz || !in_array($quiz->project_id, $this->visibleProjectIds(), true)) {
            return [null, ['error' => 'Quiz introuvable ou inaccessible.']];
        }
        if (!$this->user->can('manage', [Quiz::class, $quiz->project])) {
            return [null, ['error' => "Seuls les managers peuvent gérer les quiz de ce projet."]];
        }
        return [$quiz, null];
    }

    private function listQuizzes(array $in): array
    {
        $projectId = (int) ($in['project_id'] ?? 0);
        if (!in_array($projectId, $this->visibleProjectIds(), true)) {
            return ['error' => 'Projet introuvable ou inaccessible.'];
        }
        $quizzes = Quiz::where('project_id', $projectId)->latest()->get()->map(fn ($q) => [
            'id' => $q->id,
            'title' => $q->title,
            'status' => $q->is_active ? 'Actif' : 'Inactif',
            'duration_minutes' => $q->duration_minutes,
            'link' => $this->mdLink($q->title, "/projects/{$projectId}/quizzes/{$q->id}")
        ]);
        return ['count' => $quizzes->count(), 'quizzes' => $quizzes->all()];
    }

    private function getQuiz(array $in): array
    {
        [$quiz, $err] = $this->resolveQuizForAccess((int) ($in['quiz_id'] ?? 0));
        if ($err) return $err;
        
        $quiz->load('questions');
        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'duration_minutes' => $quiz->duration_minutes,
            'questions_count' => $quiz->questions->count(),
            'questions' => $quiz->questions->map(fn($q) => [
                'id' => $q->id,
                'text' => $q->question_text,
                'type' => $q->question_type,
                'correct_answer' => $q->correct_answer
            ])->all()
        ];
    }

    private function createQuiz(array $in): array
    {
        $projectId = (int) ($in['project_id'] ?? 0);
        if (!in_array($projectId, $this->visibleProjectIds(), true) || !$this->user->can('manage', [Quiz::class, Project::find($projectId)])) {
            return ['error' => 'Permissions insuffisantes pour ce projet.'];
        }
        
        $quiz = Quiz::create([
            'project_id' => $projectId,
            'created_by' => $this->user->id,
            'title' => $in['title'],
            'description' => $in['description'] ?? '',
            'duration_minutes' => $in['duration_minutes'] ?? 30,
            'quiz_type' => Quiz::TYPE_MIXED,
            'is_active' => true,
            'is_draft' => false
        ]);
        
        return ['success' => true, 'quiz_id' => $quiz->id, 'title' => $quiz->title, 'link' => $this->mdLink($quiz->title, "/projects/{$projectId}/quizzes/{$quiz->id}")];
    }

    private function updateQuiz(array $in): array
    {
        [$quiz, $err] = $this->resolveQuizForAccess((int) ($in['quiz_id'] ?? 0));
        if ($err) return $err;
        
        if (isset($in['title'])) $quiz->title = $in['title'];
        if (isset($in['description'])) $quiz->description = $in['description'];
        if (isset($in['duration_minutes'])) $quiz->duration_minutes = $in['duration_minutes'];
        $quiz->save();
        
        return ['success' => true, 'quiz_id' => $quiz->id, 'title' => $quiz->title];
    }

    private function addQuizCandidate(array $in): array
    {
        [$quiz, $err] = $this->resolveQuizForAccess((int) ($in['quiz_id'] ?? 0));
        if ($err) return $err;
        
        $userId = (int) ($in['user_id'] ?? 0);
        $user = User::find($userId);
        if (!$user) return ['error' => 'Utilisateur introuvable.'];
        
        QuizCandidate::updateOrCreate(
            ['quiz_id' => $quiz->id, 'user_id' => $user->id],
            ['added_by' => $this->user->id]
        );
        
        return ['success' => true, 'message' => "Candidat {$user->name} ajouté au quiz."];
    }
    
    private function getQuizAttemptToGrade(array $in): array
    {
        $attemptId = (int) ($in['attempt_id'] ?? 0);
        $attempt = QuizAttempt::with(['quiz.questions', 'responses'])->find($attemptId);
        
        if (!$attempt) return ['error' => 'Tentative introuvable.'];
        
        [$quiz, $err] = $this->resolveQuizForAccess($attempt->quiz_id);
        if ($err) return $err;
        
        $questionsById = $quiz->questions->keyBy('id');
        
        $responses = $attempt->responses->map(function ($r) use ($questionsById) {
            $q = $questionsById->get($r->question_id);
            return [
                'response_id' => $r->id,
                'question' => $q ? $q->question_text : 'Question supprimée',
                'correct_answer' => $q ? $q->correct_answer : null, 
                'student_answer' => $r->answer_text,
                'current_score' => $r->score,
                'max_score' => QuizScoringService::writtenMax()
            ];
        });
        
        return [
            'attempt_id' => $attempt->id,
            'quiz_title' => $quiz->title,
            'responses_to_grade' => $responses->all()
        ];
    }

    private function submitQuizGrades(array $in): array
    {
        $attemptId = (int) ($in['attempt_id'] ?? 0);
        $attempt = QuizAttempt::with('quiz')->find($attemptId);
        
        if (!$attempt) return ['error' => 'Tentative introuvable.'];
        
        [$quiz, $err] = $this->resolveQuizForAccess($attempt->quiz_id);
        if ($err) return $err;
        
        $gradingService = app(\App\Services\Quiz\QuizGradingService::class);
        
        try {
            $gradingService->saveCopy($quiz, $attempt, $this->user, $in['grades']);
            return ['success' => true, 'message' => 'Notes enregistrées avec succès.'];
        } catch (\Exception $e) {
            return ['error' => "Erreur lors de l'enregistrement des notes: " . $e->getMessage()];
        }
    }
}
