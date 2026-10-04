<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSetting extends Model
{
    protected $fillable = ['enabled', 'daily_limit', 'max_tokens', 'timeout', 'provider_order', 'enabled_providers'];

    protected $casts = [
        'enabled' => 'boolean',
        'provider_order' => 'array',
        'enabled_providers' => 'array',
    ];
}
