<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityRead extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'last_read_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'last_read_at' => 'datetime',
    ];

    /**
     * Relationship: each ActivityRead belongs to a User.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
