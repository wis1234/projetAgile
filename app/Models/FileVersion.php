<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileVersion extends Model
{
    protected $fillable = [
        'file_id', 'user_id', 'content',
        'label', 'summary', 'version_number',
    ];

    public function file() { return $this->belongsTo(File::class); }
    public function user() { return $this->belongsTo(User::class); }
}