<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

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
}
