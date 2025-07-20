<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sprint extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'description', 'start_date', 'end_date', 'project_id'];

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'un sprint
        static::deleting(function ($sprint) {
            // Supprimer toutes les tâches du sprint
            $sprint->tasks()->delete();
        });
    }

    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function tasks() {
        return $this->hasMany(Task::class);
    }
}
