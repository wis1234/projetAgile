<?php

namespace App\Models;

use App\Services\InboxCrypto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrivateInboxMessage extends Model
{
    protected $table = 'private_inbox_messages';

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'receiver_id',
        'content_ciphertext',
        'iv',
        'tag',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(PrivateConversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function decryptedContent(): string
    {
        $conversation = $this->conversation()->first();

        if (!$conversation) {
            return '';
        }

        return InboxCrypto::decrypt([
            'ciphertext' => $this->content_ciphertext,
            'iv' => $this->iv,
            'tag' => $this->tag,
        ], (int) $conversation->user_a_id, (int) $conversation->user_b_id);
    }
}
