<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Auth;

class ProjectNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $type;
    public $data;

    /** Couleurs de badge pour les priorités (label => couleur hex) */
    protected const PRIORITY_COLORS = [
        'Basse'   => '#10B981',
        'Moyenne' => '#F59E0B',
        'Haute'   => '#EF4444',
    ];

    /** Couleurs de badge pour les statuts (label => couleur hex) */
    protected const STATUS_COLORS = [
        'À faire'    => '#9CA3AF',
        'En cours'   => '#3B82F6',
        'Terminé'    => '#10B981',
        'Nouveau'    => '#8B5CF6',
        'En attente' => '#F59E0B',
    ];

    protected const DEFAULT_BADGE_COLOR = '#9CA3AF';

    /**
     * @param string $type Type de notification
     * @param array $data Données de la notification
     */
    public function __construct($type, $data = [])
    {
        $this->type = $type;
        $this->data = $data;
    }

    public function via($notifiable)
    {
        $preferenceKey = $this->data['preference_key'] ?? 'project_updates';

        if ($notifiable->shouldReceiveNotification($preferenceKey)) {
            return ['mail', 'database'];
        }

        return ['database'];
    }

    public function toMail($notifiable)
    {
        $projectName = $this->data['project_name'] ?? 'Projet';
        $viewData = $this->buildViewData($notifiable, $projectName);

        return (new MailMessage)
            ->subject($viewData['subject'])
            ->view('emails.notification', $viewData);
    }

    /**
     * Construit toutes les données structurées passées à la vue, en fonction du type de notification.
     * Aucune donnée n'est du HTML brut : la vue Blade se charge de l'échappement ({{ }}).
     */
    protected function buildViewData($notifiable, string $projectName): array
    {
        $base = [
            'subject'          => "Projet {$projectName} - Notification de mise à jour",
            'headerTitle'      => 'Notification de mise à jour',
            'greeting'         => "Salut {$notifiable->name},",
            'showActionButton' => true,
            'footer'           => 'Ceci est une notification automatique, merci de ne pas y répondre.',
        ];

        switch ($this->type) {
            case 'user_added':
                $projectId = $this->data['project_id'];
                $date = now()->format('d/m/Y \à H:i');

                return array_merge($base, [
                    'heading'    => "Bienvenue sur le projet <strong>" . e($projectName) . "</strong>",
                    'intro'      => "Vous avez été ajouté(e) en tant que <strong>" . e(ucfirst($this->data['role'] ?? 'membre')) . "</strong> "
                                  . "par <strong>" . e($this->data['added_by'] ?? 'un administrateur') . "</strong> le {$date}. "
                                  . "Vous avez désormais accès à toutes les fonctionnalités de ce projet.",
                    'actionText' => 'Accéder au projet',
                    'actionUrl'  => route('projects.show', $projectId),
                ]);

            case 'user_added_to_project':
                $projectId = $this->data['project_id'];

                return array_merge($base, [
                    'heading'    => "Nouveau membre dans le projet <strong>" . e($projectName) . "</strong>",
                    'metaItems'  => [
                        ['icon' => '👤', 'label' => 'Membre',    'value' => trim(($this->data['user_name'] ?? 'Nouveau membre') . ' (' . ($this->data['user_email'] ?? '') . ')')],
                        ['icon' => '🎯', 'label' => 'Rôle',      'value' => $this->data['role'] ?? "membre de l'équipe"],
                        ['icon' => '👥', 'label' => 'Ajouté par', 'value' => $this->data['added_by'] ?? 'un administrateur'],
                        ['icon' => '📅', 'label' => 'Date',      'value' => now()->format('d/m/Y à H:i')],
                    ],
                    'actionText' => 'Voir le projet',
                    'actionUrl'  => route('projects.show', $projectId),
                ]);

            case 'task_created':
                $taskId = $this->data['task_id'] ?? null;
                $status = $this->getStatusText($this->data['task_status'] ?? '');
                $priority = $this->getPriorityText($this->data['task_priority'] ?? '');

                return array_merge($base, [
                    'heading'     => "Nouvelle tâche dans le projet <strong>" . e($projectName) . "</strong>",
                    'subheading'  => $this->data['task_title'] ?? 'Nouvelle tâche',
                    'badges'      => [
                        ['label' => $status, 'color' => $this->statusColor($status)],
                        ['label' => $priority, 'color' => $this->priorityColor($priority)],
                    ],
                    'metaItems'   => [
                        ['icon' => '👤', 'label' => 'Assignée à', 'value' => $this->data['assigned_to'] ?? 'Non assigné'],
                        ['icon' => '📅', 'label' => 'Échéance',   'value' => $this->data['due_date'] ?? 'Non définie'],
                        ['icon' => '👤', 'label' => 'Créée par',  'value' => $this->data['created_by'] ?? 'Système'],
                    ],
                    'description' => $this->data['task_description'] ?? 'Aucune description fournie',
                    'actionText'  => '👀 Voir la tâche',
                    'actionUrl'   => $taskId ? route('tasks.show', $taskId) : route('projects.show', $this->data['project_id']),
                ]);

            case 'task_updated':
                $taskId = $this->data['task_id'] ?? null;
                $projectId = $this->data['project_id'];
                $newStatus = $this->getStatusText($this->data['task_status'] ?? '');
                $oldStatus = isset($this->data['old_status']) ? $this->getStatusText($this->data['old_status']) : null;
                $priority = $this->getPriorityText($this->data['task_priority'] ?? '');

                $viewData = array_merge($base, [
                    'heading'     => "Tâche mise à jour dans le projet <strong>" . e($projectName) . "</strong>",
                    'subheading'  => $this->data['task_title'] ?? 'Tâche mise à jour',
                    'badges'      => [
                        ['label' => $priority, 'color' => $this->priorityColor($priority)],
                    ],
                    'metaItems'   => [
                        ['icon' => '👤', 'label' => 'Assignée à',      'value' => $this->data['assigned_to'] ?? 'Non assigné'],
                        ['icon' => '📅', 'label' => 'Échéance',        'value' => $this->data['due_date'] ?? 'Non définie'],
                        ['icon' => '🔄', 'label' => 'Mise à jour par', 'value' => $this->data['updated_by'] ?? 'Système'],
                    ],
                    'actionText'  => '👀 Voir la tâche',
                    'actionUrl'   => $taskId ? route('tasks.show', $taskId) : route('projects.show', $projectId),
                ]);

                if ($oldStatus) {
                    $viewData['statusTransition'] = ['from' => $oldStatus, 'to' => $newStatus, 'color' => $this->statusColor($newStatus)];
                } else {
                    $viewData['badges'][] = ['label' => $newStatus, 'color' => $this->statusColor($newStatus)];
                }

                // Lien de désabonnement si l'utilisateur est connecté
                if (isset($notifiable->id)) {
                    $viewData['unsubscribeUrl'] = route('profile.notifications.unsubscribe', [
                        'user' => $notifiable->id,
                        'type' => 'task_updates',
                        'token' => $notifiable->email_verification_token,
                    ]);
                }

                return $viewData;

            case 'project_status_changed':
                $newStatus = $this->getStatusText($this->data['new_status'] ?? '');
                $oldStatus = $this->getStatusText($this->data['old_status'] ?? '');

                return array_merge($base, [
                    'heading'          => "Changement de statut pour le projet <strong>" . e($projectName) . "</strong>",
                    'metaItems'        => [
                        ['icon' => '📊', 'label' => 'Statut modifié par', 'value' => $this->data['changed_by'] ?? 'un utilisateur'],
                        ['icon' => '📅', 'label' => 'Date du changement', 'value' => now()->format('d/m/Y à H:i')],
                    ],
                    'statusTransition' => ['from' => $oldStatus, 'to' => $newStatus, 'color' => '#4F46E5'],
                    'actionText'       => '👀 Voir le projet',
                    'actionUrl'        => route('projects.show', $this->data['project_id']),
                ]);

            case 'meeting_reminder':
                $meetingTime = $this->data['meeting_time'] ?? null;
                $meetingUrl = $this->data['meeting_url'] ?? null;

                return array_merge($base, [
                    'headerTitle' => '🔔 Rappel de réunion',
                    'heading'     => 'Rappel : Réunion à venir',
                    'subheading'  => $this->data['meeting_title'] ?? 'Réunion',
                    'metaItems'   => [
                        ['icon' => '📅', 'label' => 'Date',         'value' => $meetingTime ? \Carbon\Carbon::parse($meetingTime)->format('d/m/Y') : 'Non définie'],
                        ['icon' => '🕒', 'label' => 'Heure',        'value' => $meetingTime ? \Carbon\Carbon::parse($meetingTime)->format('H:i') : 'Non définie'],
                        ['icon' => '📍', 'label' => 'Lieu',         'value' => $this->data['location'] ?? 'en ligne'],
                        ['icon' => '👤', 'label' => 'Organisateur', 'value' => $this->data['organizer_name'] ?? 'un organisateur'],
                    ],
                    'showActionButton' => (bool) $meetingUrl,
                    'actionText'  => '🎯 Rejoindre la réunion',
                    'actionUrl'   => $meetingUrl,
                ]);

            default:
                return array_merge($base, [
                    'intro'            => 'Une mise à jour a été effectuée sur le projet.',
                    'showActionButton' => false,
                ]);
        }
    }

    protected function priorityColor(string $priority): string
    {
        return self::PRIORITY_COLORS[$priority] ?? self::DEFAULT_BADGE_COLOR;
    }

    protected function statusColor(string $status): string
    {
        return self::STATUS_COLORS[$status] ?? self::DEFAULT_BADGE_COLOR;
    }

    public function toArray($notifiable)
    {
        return [
            'type' => $this->type,
            'project_id' => $this->data['project_id'] ?? null,
            'project_name' => $this->data['project_name'] ?? null,
            'task_id' => $this->data['task_id'] ?? null,
            'task_title' => $this->data['task_title'] ?? null,
            'message' => $this->data['message'] ?? "Mise à jour du projet",
            'initiator_id' => Auth::id(),
            'role' => $this->data['role'] ?? null,
            'added_by' => $this->data['added_by'] ?? null,
        ];
    }

    protected function getStatusText($status)
    {
        $statuses = [
            'todo' => 'À faire',
            'in_progress' => 'En cours',
            'done' => 'Terminé',
            'nouveau' => 'Nouveau',
            'en_cours' => 'En cours',
            'termine' => 'Terminé',
            'en_attente' => 'En attente',
        ];

        return $statuses[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    protected function getPriorityText($priority)
    {
        $priorities = [
            'low' => 'Basse',
            'medium' => 'Moyenne',
            'high' => 'Haute',
        ];

        return $priorities[$priority] ?? ucfirst($priority);
    }
}