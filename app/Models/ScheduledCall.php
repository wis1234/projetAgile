<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ScheduledCall extends Model {
    protected $fillable = ['project_id', 'initiator_id', 'title', 'scheduled_at', 'reminded_at', 'status'];
    protected $casts = [
        'scheduled_at' => 'datetime',
        'reminded_at' => 'datetime',
    ];
    public function project() { return $this->belongsTo(Project::class); }
    public function initiator() { return $this->belongsTo(User::class, 'initiator_id'); }
}
