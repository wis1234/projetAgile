<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'guest_name',
        'guest_email',
        'attempt_id',
        'score',
        'score_exact',
        'correct_answers',
        'total_questions',
        'grading_status',
        'completed_at',
    ];

    protected $casts = [
        'score' => 'integer',
        'score_exact' => 'float',
        'completed_at' => 'datetime',
        'correct_answers' => 'integer',
        'total_questions' => 'integer',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_GRADED = 'graded';

    protected $appends = ['is_pending'];

    public function getIsPendingAttribute(): bool
    {
        return $this->grading_status === self::STATUS_PENDING;
    }

    /**
     * Note précise (2 décimales) : sert aux classements et aux cumuls.
     */
    public function exactScore(): float
    {
        return (float) ($this->score_exact ?? $this->score);
    }

    /**
     * Clé stable d'un candidat (compte ProJA ou invité identifié par son e-mail).
     */
    public function candidateKey(): string
    {
        return $this->user_id
            ? 'u' . $this->user_id
            : 'g' . mb_strtolower(trim((string) $this->guest_email));
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }
}
