<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use App\Notifications\UserActionMailNotification;

class ProjectNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $type;
    public $data;

    /**
     * Create a new notification instance.
     *
     * @param string $type Type of notification
     * @param array $data Notification data
     */
    public function __construct($type, $data = [])
    {
        $this->type = $type;
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $subject = "Nouvelle notification pour le projet : " . ($this->data['project_name'] ?? 'Projet');
        $greeting = "Bonjour {$notifiable->name},";
        $messageContent = '';

        switch ($this->type) {
            case 'user_added':
                $messageContent = "Nous sommes heureux de vous informer que vous avez été ajouté(e) au projet <strong>" . ($this->data['project_name'] ?? 'Nouveau projet') . "</strong> en tant que <strong>" . ($this->data['role'] ?? 'membre de l\'équipe') . "</strong> par <strong>" . ($this->data['added_by'] ?? 'un administrateur') . "</strong> le " . now()->format('d/m/Y à H:i') . ".";
                $messageContent .= "<br><br>Vous avez désormais accès à toutes les fonctionnalités de ce projet. Pour commencer à collaborer, cliquez sur le bouton ci-dessous.";
                $actionText = 'Accéder au projet';
                $actionUrl = route('projects.show', $this->data['project_id']);
                break;

            case 'user_added_to_project':
                $messageContent = "Un nouveau membre a rejoint le projet <strong>" . ($this->data['project_name'] ?? '') . "</strong>.";
                $messageContent .= "<br><br><strong>Nouveau membre :</strong> " . ($this->data['user_name'] ?? '') . ' (' . ($this->data['user_email'] ?? '') . ')';
                $messageContent .= "<br><strong>Rôle :</strong> " . ($this->data['role'] ?? 'membre de l\'équipe');
                $messageContent .= "<br><strong>Ajouté par :</strong> " . ($this->data['added_by'] ?? 'un administrateur');
                $actionText = 'Voir le projet';
                $actionUrl = route('projects.show', $this->data['project_id']);
                break;

            case 'task_created':
                $messageContent = "Une nouvelle tâche a été créée dans le projet <strong>" . ($this->data['project_name'] ?? '') . "</strong>.";
                $messageContent .= "<br><br><strong>📌 Tâche :</strong> " . ($this->data['task_title'] ?? 'Nouvelle tâche');
                $messageContent .= "<br><strong>📝 Description :</strong> " . ($this->data['task_description'] ?? 'Aucune description fournie');
                $messageContent .= "<br><strong>📊 Statut :</strong> " . ($this->getStatusText($this->data['task_status'] ?? '') ?? 'Non défini');
                $messageContent .= "<br><strong>🏷️ Priorité :</strong> " . ($this->getPriorityText($this->data['task_priority'] ?? '') ?? 'Non définie');
                $messageContent .= "<br><strong>👤 Assignée à :</strong> " . ($this->data['assigned_to'] ?? 'Non assigné');
                $messageContent .= "<br><strong>📅 Échéance :</strong> " . ($this->data['due_date'] ?? 'Non définie');
                $messageContent .= "<br><strong>👤 Créée par :</strong> " . ($this->data['created_by'] ?? 'Système');
                $actionText = '👀 Voir la tâche';
                $actionUrl = isset($this->data['task_id']) ? route('tasks.show', $this->data['task_id']) : null;
                break;

            case 'task_updated':
                $messageContent = "La tâche suivante a été mise à jour dans le projet <strong>" . ($this->data['project_name'] ?? '') . "</strong>.";
                $messageContent .= "<br><br><strong>📌 Tâche :</strong> " . ($this->data['task_title'] ?? 'Tâche mise à jour');
                $messageContent .= "<br><strong>📊 Nouveau statut :</strong> " . ($this->getStatusText($this->data['task_status'] ?? '') ?? 'Non défini');
                if (isset($this->data['old_status'])) {
                    $messageContent .= "<br><strong>🔄 Ancien statut :</strong> " . $this->getStatusText($this->data['old_status']);
                }
                $messageContent .= "<br><strong>🏷️ Priorité :</strong> " . ($this->getPriorityText($this->data['task_priority'] ?? '') ?? 'Non définie');
                $messageContent .= "<br><strong>👤 Assignée à :</strong> " . ($this->data['assigned_to'] ?? 'Non assigné');
                $messageContent .= "<br><strong>📅 Échéance :</strong> " . ($this->data['due_date'] ?? 'Non définie');
                $messageContent .= "<br><strong>🔄 Mise à jour par :</strong> " . ($this->data['updated_by'] ?? 'Système');
                $actionText = '👀 Voir la tâche';
                $actionUrl = isset($this->data['task_id']) ? route('tasks.show', $this->data['task_id']) : null;
                break;

            default:
                $messageContent = "Une mise à jour a été effectuée sur le projet.";
                $actionText = null;
                $actionUrl = null;
                break;
        }

        $userActionNotification = new UserActionMailNotification(
            $subject,
            $messageContent,
            $actionUrl,
            $actionText
        );

        return $userActionNotification->toMail($notifiable);
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
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

    /**
     * Get the text representation of a status.
     *
     * @param string $status
     * @return string
     */
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

    /**
     * Get the text representation of a priority.
     *
     * @param string $priority
     * @return string
     */
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