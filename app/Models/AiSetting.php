<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSetting extends Model
{
    protected $fillable = [
        'enabled', 'daily_limit', 'max_tokens', 'timeout', 'provider_order', 'enabled_providers',
        'max_steps', 'max_message_chars', 'voice_enabled', 'voice_daily_limit',
        'files_read_enabled', 'files_write_enabled', 'members_manage_enabled', 'reports_enabled',
        'custom_instructions', 'retention_days',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'voice_enabled' => 'boolean',
        'files_read_enabled' => 'boolean',
        'files_write_enabled' => 'boolean',
        'members_manage_enabled' => 'boolean',
        'reports_enabled' => 'boolean',
        'provider_order' => 'array',
        'enabled_providers' => 'array',
    ];
}
