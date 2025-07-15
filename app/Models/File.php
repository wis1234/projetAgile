<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $fillable = ['name', 'file_path', 'type', 'size', 'user_id', 'project_id', 'task_id', 'kanban_id', 'description', 'downloads', 'status', 'rejection_reason'];

    public function user() {
        return $this->belongsTo(User::class);
    }
    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function messages() {
        return $this->hasMany(Message::class);
    }
    public function task() {
        return $this->belongsTo(Task::class);
    }
    public function kanban() {
        return $this->belongsTo(Sprint::class, 'kanban_id');
    }
}
