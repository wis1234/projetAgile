<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    protected $fillable = [
        'user_id', 'type', 'description', 'subject_type', 'subject_id', 'ip_address', 'user_agent',
    ];

    protected $appends = ['notification_message', 'subject_label', 'type_label'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo(null, 'subject_type', 'subject_id');
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('admin')) {
            return $query;
        }

        $projectIds = $user->projects()->pluck('projects.id');

        return $query->where(function (Builder $q) use ($projectIds, $user) {
            $q->whereHasMorph('subject', [Project::class], function (Builder $sq) use ($projectIds) {
                $sq->whereIn('id', $projectIds);
            })
                ->orWhereHasMorph('subject', [Task::class, File::class, Sprint::class], function (Builder $sq) use ($projectIds) {
                    $sq->whereIn('project_id', $projectIds);
                })
                ->orWhereHasMorph('subject', [TaskComment::class], function (Builder $sq) use ($projectIds) {
                    $sq->whereHas('task', fn (Builder $tq) => $tq->whereIn('project_id', $projectIds));
                })
                ->orWhereHasMorph('subject', [Message::class], function (Builder $sq) use ($projectIds) {
                    $sq->whereIn('project_id', $projectIds);
                })
                ->orWhere('user_id', $user->id);
        });
    }

    public static function typeLabels(): array
    {
        return [
            'login' => 'Connexion',
            'logout' => 'Déconnexion',
            'create' => 'Création',
            'update' => 'Modification',
            'delete' => 'Suppression',
            'upload' => 'Upload',
            'restore' => 'Restauration',
            'view' => 'Consultation',
            'call_started' => 'Appel',
            'call_ended' => 'Appel terminé',
            'call_answered' => 'Appel accepté',
            'comment' => 'Commentaire',
            'reaction' => 'Réaction',
            'member_add' => 'Membre ajouté',
            'member_remove' => 'Membre retiré',
            'member_role' => 'Rôle membre',
            'status' => 'Changement de statut',
            'assign' => 'Assignation',
        ];
    }

    public function getTypeLabelAttribute(): string
    {
        return self::typeLabels()[$this->type] ?? ucfirst(str_replace('_', ' ', $this->type));
    }

    public function getSubjectLabelAttribute(): ?string
    {
        if (!$this->subject_type) {
            return null;
        }

        $base = class_basename($this->subject_type);

        return $this->subject_id ? "{$base} #{$this->subject_id}" : $base;
    }

    public function getNotificationMessageAttribute(): string
    {
        if ($this->description) {
            return $this->description;
        }

        $subject = $this->subject_label ?? 'élément';

        return match ($this->type) {
            'login' => 'Nouvelle connexion',
            'logout' => 'Déconnexion',
            'create' => "Création : {$subject}",
            'update' => "Modification : {$subject}",
            'delete' => "Suppression : {$subject}",
            'upload' => 'Fichier uploadé',
            'restore' => "Restauration : {$subject}",
            'view' => "Consultation : {$subject}",
            'call_started' => 'Appel ProJA démarré',
            'call_ended' => 'Appel ProJA terminé',
            'call_answered' => 'Appel ProJA accepté',
            default => 'Nouvelle activité',
        };
    }

    public function resolveUrl(): string
    {
        if (!$this->subject_type || !$this->subject_id) {
            return route('activities.show', $this->id);
        }

        $subject = $this->subject;

        return match ($this->subject_type) {
            Project::class => route('projects.show', $this->subject_id),
            Task::class => route('tasks.show', $this->subject_id),
            File::class => route('files.show', $this->subject_id),
            Sprint::class => route('sprints.show', $this->subject_id),
            TaskComment::class => $subject?->task_id
                ? route('tasks.show', $subject->task_id)
                : route('activities.show', $this->id),
            User::class => route('users.show', $this->subject_id),
            Message::class => route('messages.index'),
            default => route('activities.show', $this->id),
        };
    }

    public function toNotificationPayload(?bool $isRead = null): array
    {
        return [
            'id' => $this->id,
            'message' => $this->notification_message,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'created_at' => $this->created_at?->toIso8601String(),
            'url' => $this->resolveUrl(),
            'user' => $this->user?->name,
            'user_id' => $this->user_id,
            'is_read' => $isRead ?? false,
        ];
    }
}
