<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUserSetting extends Model
{
    protected $fillable = ['user_id', 'daily_limit', 'enabled'];

    protected $casts = [
        'daily_limit' => 'integer',
        'enabled' => 'boolean',
    ];
}
