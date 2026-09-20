<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * Bonus de participation attribué à un membre pour son implication pendant les formations.
 */
class ParticipationPoint extends Model
{
    protected $fillable = [
        'project_id',
        'quiz_id',
        'user_id',
        'awarded_by',
        'points',
        'reason',
        'awarded_on',
    ];

    protected $casts = [
        'points' => 'float',
        'awarded_on' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function awarder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }

    /**
     * Total brut par membre (user_id => somme) des anciens bonus « généraux » du projet
     * (attribués avant que le bonus soit rattaché à un quiz : quiz_id NULL).
     */
    public static function totalsForProject(int $projectId): Collection
    {
        return static::where('project_id', $projectId)
            ->whereNull('quiz_id')
            ->selectRaw('user_id, SUM(points) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id')
            ->map(fn ($v) => (float) $v);
    }

    /**
     * Total brut par membre du quiz (user_id => somme) : bonus attribués dans ce quiz,
     * plus les anciens bonus généraux du projet.
     */
    public static function totalsForQuiz(Quiz $quiz): Collection
    {
        return static::totalsForQuizzes($quiz->project_id, [$quiz->id]);
    }

    /**
     * Idem pour plusieurs quiz (cumuls) : les bonus de tous ces quiz s'additionnent,
     * les anciens bonus généraux ne sont comptés qu'une fois.
     *
     * @param list<int> $quizIds
     */
    public static function totalsForQuizzes(int $projectId, array $quizIds): Collection
    {
        return static::where('project_id', $projectId)
            ->where(fn ($q) => $q->whereNull('quiz_id')->orWhereIn('quiz_id', $quizIds))
            ->selectRaw('user_id, SUM(points) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id')
            ->map(fn ($v) => (float) $v);
    }

    /**
     * Bonus effectif : jamais négatif, plafonné par config('quiz.participation_cap').
     */
    public static function capped(float $raw): float
    {
        return round(max(0.0, min((float) config('quiz.participation_cap', 10), $raw)), 2);
    }
}
