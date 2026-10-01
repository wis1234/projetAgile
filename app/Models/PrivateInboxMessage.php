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
        'type',
        'content_ciphertext',
        'iv',
        'tag',
        'attachment_path',
        'attachment_kind',
        'reply_to_id',
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

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    public function decryptedContent(): string
    {
        // Relation chargée en amont (with('conversation')) pour éviter 1 requête par message
        $conversation = $this->conversation;

        if (!$conversation) {
            return '';
        }

        try {
            return InboxCrypto::decrypt([
                'ciphertext' => $this->content_ciphertext,
                'iv' => $this->iv,
                'tag' => $this->tag,
            ], (int) $conversation->user_a_id, (int) $conversation->user_b_id);
        } catch (\Throwable $e) {
            // Un message illisible ne doit jamais faire tomber toute la liste
            return '';
        }
    }

    /** Texte court pour la liste des conversations / les citations. */
    public static function previewFor(string $type, string $content): string
    {
        return match ($type) {
            'image' => $content !== '' ? '📷 ' . $content : '📷 Photo',
            'audio' => '🎤 Message vocal',
            'video' => $content !== '' ? '🎬 ' . $content : '🎬 Vidéo',
            'sticker' => 'Sticker',
            default => trim(preg_replace('/\s+/', ' ', $content)),
        };
    }

    /** Représentation JSON unique (liste, fil, temps réel). */
    public function toPayload(int $viewerId): array
    {
        $content = $this->decryptedContent();
        $reply = null;

        if ($this->reply_to_id && $this->relationLoaded('replyTo') && $this->replyTo) {
            $parent = $this->replyTo;
            $parent->setRelation('conversation', $this->conversation);
            $reply = [
                'id' => $parent->id,
                'sender_id' => $parent->sender_id,
                'type' => $parent->type,
                'preview' => self::previewFor($parent->type, $parent->decryptedContent()),
                'is_me' => (int) $parent->sender_id === $viewerId,
            ];
        }

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'type' => $this->type ?: 'text',
            'content' => $content,
            'preview' => self::previewFor($this->type ?: 'text', $content),
            'attachment_path' => $this->attachment_path,
            'attachment_kind' => $this->attachment_kind,
            'reply_to' => $reply,
            'created_at' => $this->created_at?->toIso8601String(),
            'read_at' => $this->read_at?->toIso8601String(),
            'is_me' => (int) $this->sender_id === $viewerId,
        ];
    }
}
