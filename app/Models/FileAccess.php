<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileAccess extends Model
{
    protected $fillable = [
        'file_id', 'user_id', 'permission', 'granted_by', 'expires_at',
    ];

    protected $casts = ['expires_at' => 'datetime'];

    public function file()      { return $this->belongsTo(File::class); }
    public function user()      { return $this->belongsTo(User::class); }
    public function grantedBy() { return $this->belongsTo(User::class, 'granted_by'); }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function effectivePermission(): string
    {
        return $this->isExpired() ? 'none' : $this->permission;
    }
}
