<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'un projet
        static::deleting(function ($project) {
            // Supprimer les sprints (qui supprimeront automatiquement leurs tâches)
            $project->sprints()->delete();
            
            // Supprimer les tâches restantes
            $project->tasks()->delete();
            
            // Supprimer les fichiers
            $project->files()->delete();
            
            // Supprimer les messages
            $project->messages()->delete();
            
            // Supprimer les logs d'audit
            $project->auditLogs()->delete();
            
            // Supprimer les relations many-to-many avec les utilisateurs
            $project->users()->detach();
        });
    }

    public function users() {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }
    public function sprints() {
        return $this->hasMany(Sprint::class);
    }
    public function tasks() {
        return $this->hasMany(Task::class);
    }
    public function files() {
        return $this->hasMany(File::class);
    }
    public function messages() {
        return $this->hasMany(Message::class);
    }
    public function auditLogs() {
        return $this->hasMany(AuditLog::class);
    }

    public function isMember($user)
    {
        return $this->users()->where('user_id', $user->id)->exists();
    }
}
