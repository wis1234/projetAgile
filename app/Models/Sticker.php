<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sticker extends Model
{
    protected $fillable = ['user_id', 'name', 'image_path'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}