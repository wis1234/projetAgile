<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiPendingAction extends Model
{
    protected $fillable = ['user_id', 'conversation_id', 'tool', 'input', 'summary', 'status', 'expires_at'];

    protected $casts = ['input' => 'array', 'expires_at' => 'datetime'];
}
