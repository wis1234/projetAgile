<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sprint extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'description', 'start_date', 'end_date', 'project_id'];

    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function tasks() {
        return $this->hasMany(Task::class);
    }
}
