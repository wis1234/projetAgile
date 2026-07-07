<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    protected $fillable = ['name', 'file_path', 'type', 'size', 'user_id', 'project_id', 'task_id', 'kanban_id', 'description', 'downloads', 'status', 'rejection_reason', 'dropbox_path', 'last_modified_by', 'password_hash', 'is_password_protected'];

    /**
     * Get the full URL to the file
     *
     * @return string
     */
    public function getUrl()
    {
        if (empty($this->file_path)) {
            return null;
        }

        // Check if the file exists in storage
        if (Storage::disk('public')->exists($this->file_path)) {
            return Storage::disk('public')->url($this->file_path);
        }

        return null;
    }

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'un fichier
        static::deleting(function ($file) {
            // Supprimer tous les commentaires du fichier
            $file->comments()->delete();
            
            // Supprimer tous les messages liés au fichier
            $file->messages()->delete();
            
            // Supprimer le fichier physique du stockage
            if (file_exists(storage_path('app/public/' . $file->file_path))) {
                unlink(storage_path('app/public/' . $file->file_path));
            }
        });
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function lastModifiedBy() {
        return $this->belongsTo(User::class, 'last_modified_by');
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
    public function comments() {
        return $this->hasMany(\App\Models\FileComment::class);
    }
    
    
 // ══════════════════════════════════════════════════════════════
//  app/Models/File.php  — AJOUTER ces relations
// ══════════════════════════════════════════════════════════════

public function versions()
{
    return $this->hasMany(FileVersion::class)->orderByDesc('version_number');
}

public function accesses()
{
    return $this->hasMany(FileAccess::class);
}

public function accessFor(User $user): string
{
    // Admin global → toujours admin
    if ($user->hasRole('admin')) return 'admin';

    // Propriétaire du fichier → admin
    if ($this->user_id === $user->id) return 'admin';

    $access = $this->accesses()
        ->where('user_id', $user->id)
        ->first();

    if (! $access) return 'none';
    return $access->effectivePermission();
}

public function canUser(User $user, string $permission): bool
{
    $order = ['none' => 0, 'view' => 1, 'comment' => 2, 'edit' => 3, 'admin' => 4];
    $level = $order[$this->accessFor($user)] ?? 0;
    return $level >= ($order[$permission] ?? 99);
}


    
    
}
