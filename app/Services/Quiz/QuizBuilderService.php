<?php

namespace App\Services\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Validation\ValidationException;

/**
 * Conception d'un quiz : enregistrement question par question OU en lot,
 * avec protection des données déjà collectées auprès des candidats.
 */
class QuizBuilderService
{
    public const QUESTION_FIELDS = [
        'question_text',
        'question_type',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
    ];

    /**
     * Nettoie une question : une question écrite n'a ni option ni bonne réponse, les options vides deviennent null.
     */
    public function normalize(array $data, string $errorPrefix = ''): array
    {
        $clean = [
            'question_text' => trim((string) ($data['question_text'] ?? '')),
            'question_type' => $data['question_type'] ?? 'qcm',
        ];

        if ($clean['question_type'] === 'written') {
            return $clean + [
                'option_a' => null, 'option_b' => null, 'option_c' => null, 'option_d' => null,
                'correct_answer' => null,
            ];
        }

        foreach (['a', 'b', 'c', 'd'] as $key) {
            $value = trim((string) ($data["option_{$key}"] ?? ''));
            $clean["option_{$key}"] = $value === '' ? null : $value;
        }

        $correct = (int) ($data['correct_answer'] ?? 0);
        $options = ['option_a', 'option_b', 'option_c', 'option_d'];

        if (empty($clean[$options[$correct] ?? 'option_a'])) {
            throw ValidationException::withMessages([
                "{$errorPrefix}correct_answer" => 'La bonne réponse doit correspondre à une option renseignée.',
            ]);
        }

        $clean['correct_answer'] = $correct;

        return $clean;
    }

    public function assertEditable(Quiz $quiz): void
    {
        if ($quiz->isValidated()) {
            throw ValidationException::withMessages([
                'quiz' => 'Ce quiz a été validé en délibération : il ne peut plus être modifié.',
            ]);
        }
    }

    public function createQuestion(Quiz $quiz, array $data, string $errorPrefix = ''): QuizQuestion
    {
        $this->assertEditable($quiz);

        if ($this->locked($quiz)) {
            throw ValidationException::withMessages([
                "{$errorPrefix}question_text" => 'Des candidats ont déjà composé ce quiz : il n\'est plus possible d\'ajouter de question.',
            ]);
        }

        $question = $quiz->questions()->create(
            $this->normalize($data, $errorPrefix) + ['order' => ((int) $quiz->questions()->max('order')) + 1]
        );

        $this->refreshQuizType($quiz);

        return $question;
    }

    public function updateQuestion(Quiz $quiz, QuizQuestion $question, array $data, string $errorPrefix = ''): QuizQuestion
    {
        $this->assertEditable($quiz);

        $clean = $this->normalize($data, $errorPrefix);

        if ($this->locked($quiz)
            && ($clean['question_type'] !== $question->question_type
                || (int) $clean['correct_answer'] !== (int) $question->correct_answer)) {
            throw ValidationException::withMessages([
                "{$errorPrefix}question_type" => 'Des candidats ont déjà composé ce quiz : seul le libellé peut être modifié (pas le type ni la bonne réponse).',
            ]);
        }

        $question->update($clean);
        $this->refreshQuizType($quiz);

        return $question->refresh();
    }

    public function deleteQuestion(Quiz $quiz, QuizQuestion $question): void
    {
        $this->assertEditable($quiz);

        if ($this->locked($quiz)) {
            throw ValidationException::withMessages([
                'question' => 'Des candidats ont déjà composé ce quiz : la question ne peut plus être supprimée.',
            ]);
        }

        $question->delete();
        $this->resequence($quiz);
        $this->refreshQuizType($quiz);
    }

    /**
     * Synchronisation en lot (bouton « Enregistrer le quiz ») : met à jour par identifiant,
     * crée les nouvelles questions et supprime celles retirées — sans jamais recréer une question
     * existante (ce qui supprimerait en cascade les réponses des candidats).
     *
     * @param array<int,array> $questions
     */
    public function syncQuestions(Quiz $quiz, array $questions): void
    {
        $this->assertEditable($quiz);

        $existing = $quiz->questions()->get()->keyBy('id');
        $keptIds = [];

        foreach (array_values($questions) as $index => $data) {
            $prefix = "questions.{$index}.";
            $current = isset($data['id']) ? $existing->get((int) $data['id']) : null;

            if ($current) {
                $question = $this->updateQuestion($quiz, $current, $data, $prefix);
            } else {
                $question = $this->createQuestion($quiz, $data, $prefix);
            }

            $question->update(['order' => $index + 1]);
            $keptIds[] = $question->id;
        }

        $removed = $existing->keys()->diff($keptIds);

        if ($removed->isNotEmpty()) {
            if ($this->locked($quiz)) {
                throw ValidationException::withMessages([
                    'questions' => 'Des candidats ont déjà composé ce quiz : les questions ne peuvent plus être supprimées.',
                ]);
            }

            $quiz->questions()->whereIn('id', $removed)->delete();
        }

        $this->refreshQuizType($quiz);
    }

    /**
     * @param array<int,int> $orderedIds
     */
    public function reorder(Quiz $quiz, array $orderedIds): void
    {
        $this->assertEditable($quiz);

        $valid = $quiz->questions()->pluck('id')->all();

        foreach (array_values(array_filter($orderedIds, fn ($id) => in_array((int) $id, $valid, true))) as $i => $id) {
            $quiz->questions()->whereKey($id)->update(['order' => $i + 1]);
        }
    }

    /**
     * Le type du quiz (qcm / écrit / mixte) est déduit de ses questions : plus d'incohérence possible.
     */
    public function refreshQuizType(Quiz $quiz): void
    {
        $types = $quiz->questions()->pluck('question_type')->unique()->values();

        $type = match (true) {
            $types->count() > 1 => Quiz::TYPE_MIXED,
            $types->first() === 'written' => Quiz::TYPE_WRITTEN,
            default => Quiz::TYPE_QCM,
        };

        if ($quiz->quiz_type !== $type) {
            $quiz->update(['quiz_type' => $type]);
        }
    }

    /** Structure figée ? (mémorisé le temps de la requête pour éviter une requête par question) */
    private array $lockCache = [];

    public function locked(Quiz $quiz): bool
    {
        return $this->lockCache[$quiz->id] ??= $quiz->hasCompletedAttempts();
    }

    private function resequence(Quiz $quiz): void
    {
        foreach ($quiz->questions()->get() as $i => $q) {
            if ((int) $q->order !== $i + 1) {
                $q->update(['order' => $i + 1]);
            }
        }
    }
}
