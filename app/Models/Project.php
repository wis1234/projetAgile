<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Notifications\ProjectNotification;
use Illuminate\Support\Facades\Auth;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'status', 'deadline', 'meeting_link'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Constantes pour les statuts disponibles
    public const STATUS_NOUVEAU = 'nouveau';
    public const STATUS_DEMARRAGE = 'demarrage';
    public const STATUS_EN_COURS = 'en_cours';
    public const STATUS_AVANCE = 'avance';
    public const STATUS_TERMINE = 'termine';
    public const STATUS_SUSPENDU = 'suspendu';

    /**
     * Notifie tous les membres du projet d'un événement
     * 
     * @param string $type Type de notification (user_added, task_created, task_updated, discussion_created)
     * @param array $data Données supplémentaires pour la notification
     * @return void
     */
    public function notifyMembers($type, $data = [])
    {
        // Ajouter les informations de base du projet aux données de notification
        $notificationData = array_merge([
            'project_id' => $this->id,
            'project_name' => $this->name,
            'project_url' => route('projects.show', $this->id),
        ], $data);

        // Récupérer l'ID de l'utilisateur concerné par la notification (s'il y en a un)
        $concernedUserId = $data['user_id'] ?? null;

        // Construire la requête pour les utilisateurs à notifier
        $query = $this->users()
            ->where('users.id', '!=', Auth::id()); // Exclure l'utilisateur qui a déclenché l'action

        // Exclure l'utilisateur concerné par la notification (s'il y en a un)
        if ($concernedUserId) {
            $query->where('users.id', '!=', $concernedUserId);
        }

        // Récupérer les utilisateurs à notifier
        $users = $query->get();

        // Envoyer la notification à chaque utilisateur
        foreach ($users as $user) {
            $user->notify(new ProjectNotification($type, $notificationData));
        }
    }

    // Méthode pour obtenir tous les statuts disponibles
    public static function getAvailableStatuses()
    {
        return [
            self::STATUS_NOUVEAU => 'Nouveau',
            self::STATUS_DEMARRAGE => 'Démarrage',
            self::STATUS_EN_COURS => 'En cours',
            self::STATUS_AVANCE => 'Avancé',
            self::STATUS_TERMINE => 'Terminé',
            self::STATUS_SUSPENDU => 'Suspendu',
        ];
    }

    // Méthode pour obtenir le libellé du statut
    public function getStatusLabelAttribute()
    {
        $statuses = self::getAvailableStatuses();
        return $statuses[$this->status] ?? 'Inconnu';
    }

    // Méthode pour obtenir la couleur du statut (pour les badges)
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            self::STATUS_NOUVEAU => 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            self::STATUS_DEMARRAGE => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            self::STATUS_EN_COURS => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            self::STATUS_AVANCE => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            self::STATUS_TERMINE => 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            self::STATUS_SUSPENDU => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        };
    }

    // Méthode pour vérifier si le projet peut changer de statut
    public function canChangeStatusTo($newStatus)
    {
        $allowedTransitions = [
            self::STATUS_NOUVEAU => [self::STATUS_DEMARRAGE, self::STATUS_SUSPENDU],
            self::STATUS_DEMARRAGE => [self::STATUS_EN_COURS, self::STATUS_SUSPENDU],
            self::STATUS_EN_COURS => [self::STATUS_AVANCE, self::STATUS_SUSPENDU],
            self::STATUS_AVANCE => [self::STATUS_TERMINE, self::STATUS_SUSPENDU],
            self::STATUS_TERMINE => [self::STATUS_EN_COURS], // Réouverture possible
            self::STATUS_SUSPENDU => [self::STATUS_DEMARRAGE, self::STATUS_EN_COURS, self::STATUS_AVANCE],
        ];

        return in_array($newStatus, $allowedTransitions[$this->status] ?? []);
    }

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'un projet
        static::deleting(function ($project) {
            // Supprimer les sprints (qui supprimeront automatiquement leurs tâches)
            $project->sprints()->delete();
            
            // Supprimer les tâches restantes
            $project->tasks()->delete();
            
            // Supprimer les fichiers
            $project->files()->delete();
            
            // Supprimer les messages
            $project->messages()->delete();
            
            // Supprimer les logs d'audit
            $project->auditLogs()->delete();
            
            // Supprimer les relations many-to-many avec les utilisateurs
            $project->users()->detach();
        });
    }

    public function users() {
        return $this->belongsToMany(User::class)->withPivot(['role', 'is_muted'])->withTimestamps();
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

    public function isMember($user)
    {
        return $this->users()->where('user_id', $user->id)->exists();
    }
}
