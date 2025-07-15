<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['content', 'file_id', 'user_id', 'project_id'];

    public function user() {
        return $this->belongsTo(User::class);
    }
    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function file() {
        return $this->belongsTo(File::class);
    }
}
