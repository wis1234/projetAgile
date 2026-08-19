<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CallSession extends Model
{
    protected $fillable = [
        'project_id',
        'initiator_id',
        'room_name',
        'invite_token',
        'invite_code',
        'status',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function initiator()
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getInviteUrl(): string
    {
        return url('/meet/join/' . $this->invite_token);
    }

    public function expire(): void
    {
        $this->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public static function generateToken(): string
    {
        return Str::random(48);
    }

    public static function generateCode(): string
    {
        // Code court de 6 caractères alphanumériques en majuscules
        return strtoupper(Str::random(6));
    }
}
