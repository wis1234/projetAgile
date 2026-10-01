<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrivateConversation extends Model
{
    protected $fillable = [
        'user_a_id',
        'user_b_id',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public static function between(int $userAId, int $userBId): ?self
    {
        $participants = [$userAId, $userBId];
        sort($participants, SORT_NUMERIC);

        return self::query()
            ->where('user_a_id', $participants[0])
            ->where('user_b_id', $participants[1])
            ->first();
    }

    public static function ensureBetween(int $userAId, int $userBId): self
    {
        $conversation = self::between($userAId, $userBId);

        if ($conversation) {
            return $conversation;
        }

        $participants = [$userAId, $userBId];
        sort($participants, SORT_NUMERIC);

        return self::query()->create([
            'user_a_id' => $participants[0],
            'user_b_id' => $participants[1],
        ]);
    }

    public function userA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_a_id');
    }

    public function userB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_b_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(PrivateInboxMessage::class, 'conversation_id');
    }

    public function latestMessage(): ?PrivateInboxMessage
    {
        return $this->messages()->latest()->first();
    }

    public function otherParticipantFor(int $userId): ?User
    {
        if ((int) $this->user_a_id === (int) $userId) {
            return $this->userB()->first();
        }

        if ((int) $this->user_b_id === (int) $userId) {
            return $this->userA()->first();
        }

        return null;
    }
}
