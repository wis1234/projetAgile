<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'status', 'due_date', 'priority', 'assigned_to', 'project_id', 'sprint_id', 'position'
    ];

    public function assignedUser() {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function sprint() {
        return $this->belongsTo(Sprint::class);
    }
}
