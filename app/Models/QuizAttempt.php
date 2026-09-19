<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'guest_name',
        'guest_email',
        'answers',
        'cheating_logs',
        'status',
        'started_at',
        'completed_at',
        'grading_locked_by',
        'grading_locked_at',
        'graded_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'cheating_logs' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'grading_locked_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(QuizResult::class, 'attempt_id');
    }

    public function locker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'grading_locked_by');
    }

    /**
     * La copie est-elle actuellement réservée par un correcteur (verrou non expiré) ?
     */
    public function isLockedByOther(?int $userId): bool
    {
        if (!$this->grading_locked_by || !$this->grading_locked_at) {
            return false;
        }

        if ($userId !== null && (int) $this->grading_locked_by === $userId) {
            return false;
        }

        return $this->grading_locked_at->gt(now()->subMinutes((int) config('quiz.lock_ttl_minutes', 10)));
    }

    public function responses(): HasMany
    {
        return $this->hasMany(QuizResponse::class, 'attempt_id');
    }
}
