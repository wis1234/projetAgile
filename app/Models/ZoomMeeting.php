<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZoomMeeting extends Model
{
    protected $fillable = [
        'project_id',
        'meeting_id',
        'host_id',
        'topic',
        'agenda',
        'start_time',
        'duration',
        'timezone',
        'password',
        'start_url',
        'join_url',
        'status',
        'settings',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'settings' => 'array',
    ];

    /**
     * Get the project that owns the zoom meeting.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Check if the meeting is active
     */
    public function isActive(): bool
    {
        return $this->status === 'started' && 
               $this->start_time <= now() && 
               $this->start_time->addMinutes($this->duration) >= now();
    }

    /**
     * Check if the meeting is upcoming
     */
    public function isUpcoming(): bool
    {
        return $this->status === 'waiting' && $this->start_time > now();
    }

    /**
     * Check if the meeting is ended
     */
    public function isEnded(): bool
    {
        return $this->status === 'ended' || 
               ($this->start_time->addMinutes($this->duration) < now() && $this->status !== 'started');
    }
}
