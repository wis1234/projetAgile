<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    protected $fillable = ['name',
     'file_path', 'type', 'size', 'user_id',
      'project_id',
     'task_id', 'kanban_id', 'description',
      'downloads', 'status', 'rejection_reason',
       'dropbox_path', 'last_modified_by', 
       'password_hash', 'is_password_protected',
           'locked_by',
    'locked_by_role','yjs_state'];






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

/** Cache par requête : accessFor() est appelé plusieurs fois (policies, canal Pusher, page). */
private array $accessCache = [];

/**
 * Niveau d'accès de $user sur ce document : none < view < comment < edit < admin.
 *
 *  - admin global                          → admin
 *  - propriétaire du fichier               → admin
 *  - manager du projet                     → admin
 *  - personne assignée à la tâche liée     → edit  (écriture)
 *  - autre membre du projet (non muet)     → view  (LECTURE SEULE : il voit le document)
 *  - accès explicite (panneau Partager)    → son niveau (le plus élevé l'emporte)
 *  - toute personne étrangère au projet    → none  (aucun accès)
 */
public function accessFor(User $user): string
{
    if (! isset($this->accessCache[$user->id])) {
        $this->accessCache[$user->id] = $this->computeAccessFor($user);
    }

    return $this->accessCache[$user->id];
}

private function computeAccessFor(User $user): string
{
    // Admin global → toujours admin
    if ($user->hasRole('admin')) return 'admin';

    // Propriétaire du fichier → admin
    if ($this->user_id === $user->id) return 'admin';

    // Manager du projet (ou du projet de la tâche liée) → admin du document
    $project = $this->project ?? $this->task?->project;
    if ($project && $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->exists()) {
        return 'admin';
    }

    $rank  = ['none' => 0, 'view' => 1, 'comment' => 2, 'edit' => 3, 'admin' => 4];
    $level = 'none';

    // Personne à qui la tâche liée est assignée → droit d'écriture
    $task = $this->task;
    if ($task && $task->assigned_to !== null && (int) $task->assigned_to === (int) $user->id) {
        $level = 'edit';
    }

    // Autre membre du projet (non muet) : peut consulter le document, en lecture seule
    if ($level === 'none' && $project && $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists()) {
        $level = 'view';
    }

    // Accès explicite (partage) : on garde le niveau le plus élevé
    $access = $this->accesses()->where('user_id', $user->id)->first();
    if ($access) {
        $explicit = $access->effectivePermission();
        if (($rank[$explicit] ?? 0) > $rank[$level]) {
            $level = $explicit;
        }
    }

    return $level;
}

public function canUser(User $user, string $permission): bool
{
    $order = ['none' => 0, 'view' => 1, 'comment' => 2, 'edit' => 3, 'admin' => 4];
    $level = $order[$this->accessFor($user)] ?? 0;
    return $level >= ($order[$permission] ?? 99);
}





public function lockedBy()
{
    return $this->belongsTo(User::class, 'locked_by');
}

/**
 * Détermine si $user peut voir ce fichier sans saisir le mot de passe.
 */
public function isUnlockedFor(User $user): bool
{
    if (! $this->is_password_protected) {
        return true;
    }

    // Verrouillé par un admin → uniquement CET admin précis
    if ($this->locked_by_role === 'admin') {
        return (int) $this->locked_by === (int) $user->id;
    }

    // Verrouillé par un manager → tous les admins + les managers du projet
    if ($this->locked_by_role === 'manager') {
        if ($user->hasRole('admin')) {
            return true;
        }

        $project = $this->project ?? $this->task?->project;
        if (! $project) {
            return false;
        }

        $projectUser = $project->users()->where('user_id', $user->id)->first();
        return (bool) ($projectUser && $projectUser->pivot->role === 'manager');
    }

    return false;
}

/**
 * Détermine si le fichier est déverrouillé pour l'utilisateur (par rôle ou session).
 */
public function isUnlockedForUser(?User $user = null): bool
{
    if (! $this->is_password_protected) {
        return true;
    }

    if (! $user) {
        $user = auth()->user();
    }

    if (! $user) {
        return false;
    }

    if ($this->isUnlockedFor($user)) {
        return true;
    }

    return (bool) session("unlocked_file_{$this->id}", false);
}


}

