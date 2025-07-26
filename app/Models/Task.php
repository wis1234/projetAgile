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

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'une tâche
        static::deleting(function ($task) {
            // Supprimer tous les commentaires de la tâche
            $task->comments()->delete();
        });
    }

    public function assignedUser() {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function sprint() {
        return $this->belongsTo(Sprint::class);
    }

    public function comments() {
        return $this->hasMany(\App\Models\TaskComment::class);
    }

    public function files() {
        return $this->hasMany(File::class);
    }

    public function payments()
    {
        return $this->hasMany(TaskPayment::class);
    }
}
