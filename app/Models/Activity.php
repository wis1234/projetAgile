<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = [
        'user_id', 'type', 'description', 'subject_type', 'subject_id', 'ip_address', 'user_agent'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function subject() {
        return $this->morphTo(null, 'subject_type', 'subject_id');
    }

    public function getNotificationMessageAttribute()
    {
        // Personnaliser selon le type d'activité
        switch ($this->type) {
            case 'login':
                return 'Nouvelle connexion';
            case 'logout':
                return 'Déconnexion';
            case 'create':
                return 'Création : ' . ($this->subject_type ? class_basename($this->subject_type) : '') . ' #' . $this->subject_id;
            case 'update':
                return 'Modification : ' . ($this->subject_type ? class_basename($this->subject_type) : '') . ' #' . $this->subject_id;
            case 'delete':
                return 'Suppression : ' . ($this->subject_type ? class_basename($this->subject_type) : '') . ' #' . $this->subject_id;
            case 'upload':
                return 'Fichier uploadé';
            default:
                return $this->description ?? 'Nouvelle activité';
        }
    }
}
