<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsage extends Model
{
    protected $fillable = [
        'user_id', 'kind', 'provider', 'model', 'status', 'duration_ms', 'input_tokens', 'output_tokens', 'failure_reason',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
