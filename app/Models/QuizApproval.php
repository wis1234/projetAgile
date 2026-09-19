<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Aval (signature numérique) d'un responsable lors de la délibération d'un quiz.
 */
class QuizApproval extends Model
{
    protected $fillable = [
        'quiz_id',
        'user_id',
        'fingerprint',
        'ip_address',
        'user_agent',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
