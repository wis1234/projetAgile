<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'endpoint',
        'public_key',
        'auth_token',
        'content_encoding',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Retourne la subscription sous le format attendu par WebPush
     */
    public function toWebPushSubscription(): array
    {
        return [
            'endpoint'    => $this->endpoint,
            'publicKey'   => $this->public_key,
            'authToken'   => $this->auth_token,
            'contentEncoding' => $this->content_encoding ?? 'aesgcm',
        ];
    }
}
