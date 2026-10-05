<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsage extends Model
{
    protected $fillable = [
        'user_id', 'conversation_id', 'kind', 'provider', 'model', 'status', 'duration_ms', 'input_tokens', 'output_tokens',
        'steps', 'fallbacks', 'via_voice', 'attempts', 'tools', 'failure_reason',
    ];

    protected $casts = ['attempts' => 'array', 'tools' => 'array', 'via_voice' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
