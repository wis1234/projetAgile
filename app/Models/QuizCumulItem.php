<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizCumulItem extends Model
{
    protected $fillable = [
        'quiz_cumul_id',
        'quiz_id',
        'coefficient',
    ];

    protected $casts = [
        'coefficient' => 'float',
    ];

    public function cumul(): BelongsTo
    {
        return $this->belongsTo(QuizCumul::class, 'quiz_cumul_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
