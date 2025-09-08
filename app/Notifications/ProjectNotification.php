<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
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
        $projectName = $this->data['project_name'] ?? 'Projet';
        $subject = "Projet {$projectName} Notification de mise à jour";

        $greeting = "Salut {$notifiable->name},";
        $messageContent = '';
        $showActionButton = true; // Par défaut, on affiche le bouton d'action

        // Styles CSS pour l'email
        $styles = "
            .card { background: #ffffff; border-radius: 8px; border-left: 4px solid #4F46E5; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 20px; margin: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 8px; }
            .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
            .action-button { background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        ";

        // Construction du contenu en fonction du type de notification
        switch ($this->type) {
            case 'user_added':
                // Notification pour l'utilisateur ajouté
                $role = $this->data['role'] ?? 'membre';
                $addedBy = $this->data['added_by'] ?? 'un administrateur';
                $date = now()->format('d/m/Y \à H:i');
                $projectId = $this->data['project_id'];
                
                $messageContent = "
                    <div style='margin-bottom: 15px;'>
                        <h2 style='color: #1f2937; margin-top: 0;'>Bienvenue sur le projet <strong>{$projectName}</strong></h2>
                        <p>Vous avez été ajouté(e) en tant que <strong>" . ucfirst($role) . "</strong> par <strong>{$addedBy}</strong> le {$date}.</p>
                        <p>Vous avez désormais accès à toutes les fonctionnalités de ce projet.</p>
                        <p>Pour commencer à collaborer, cliquez sur le bouton ci-dessous :</p>
                        <div style='margin: 20px 0; text-align: center;'>
                            <a href='".route('projects.show', $projectId)."' style='background-color: #4F46E5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;'>
                                Accéder au projet
                            </a>
                        </div>
                    </div>";
                
                // On désactive le bouton d'action supplémentaire
                $showActionButton = false;
                $actionText = 'Accéder au projet';
                $actionUrl = route('projects.show', $projectId);
                break;

            case 'user_added_to_project':
                // Notification pour les membres existants du projet
                $userName = $this->data['user_name'] ?? 'Nouveau membre';
                $userEmail = $this->data['user_email'] ?? '';
                $role = $this->data['role'] ?? 'membre de l\'équipe';
                $addedBy = $this->data['added_by'] ?? 'un administrateur';
                $projectId = $this->data['project_id'];
                $date = now()->format('d/m/Y \à H:i');
                
                $messageContent = "
                    <style>{$styles}</style>
                    <div class='card'>
                        <h2 style='color: #1f2937; margin-top: 0;'>Nouveau membre dans le projet <strong>{$projectName}</strong></h2>
                        
                        <div style='background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                            <p style='margin: 5px 0;'><strong>👤 Membre :</strong> {$userName} ({$userEmail})</p>
                            <p style='margin: 5px 0;'><strong>🎯 Rôle :</strong> {$role}</p>
                            <p style='margin: 5px 0;'><strong>👥 Ajouté par :</strong> {$addedBy}</p>
                            <p style='margin: 5px 0;'><strong>📅 Date :</strong> ".now()->format('d/m/Y à H:i')."</p>
                        </div>
                        
                        <p>Bienvenue à {$userName} dans l'équipe !</p>
                        
                        <div style='margin: 20px 0;'>
                            <a href='".route('projects.show', $projectId)."' 
                               style='background-color: #4F46E5; color: white; padding: 10px 20px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;'>
                                Voir le projet
                            </a>
                        </div>
                        
                        <div class='footer'>
                            <p>Ceci est une notification automatique, merci de ne pas y répondre.</p>
                        </div>
                    </div>
                ";
                $showActionButton = false;
                $actionText = 'Voir le projet';
                $actionUrl = route('projects.show', $projectId);
                break;

            case 'task_created':
                $taskTitle = $this->data['task_title'] ?? 'Nouvelle tâche';
                $taskDescription = $this->data['task_description'] ?? 'Aucune description fournie';
                $taskStatus = $this->getStatusText($this->data['task_status'] ?? '') ?? 'Non défini';
                $taskPriority = $this->getPriorityText($this->data['task_priority'] ?? '') ?? 'Non définie';
                $assignedTo = $this->data['assigned_to'] ?? 'Non assigné';
                $dueDate = $this->data['due_date'] ?? 'Non définie';
                $createdBy = $this->data['created_by'] ?? 'Système';
                $taskId = $this->data['task_id'] ?? null;
                
                $priorityBadgeColor = [
                    'Basse' => 'background-color: #10B981; color: white;',
                    'Moyenne' => 'background-color: #F59E0B; color: white;',
                    'Haute' => 'background-color: #EF4444; color: white;',
                    'Non définie' => 'background-color: #9CA3AF; color: white;'
                ][$taskPriority] ?? 'background-color: #9CA3AF; color: white;';
                
                $statusBadgeColor = [
                    'À faire' => 'background-color: #9CA3AF;',
                    'En cours' => 'background-color: #3B82F6;',
                    'Terminé' => 'background-color: #10B981;',
                    'Nouveau' => 'background-color: #8B5CF6;',
                    'En attente' => 'background-color: #F59E0B;'
                ][$taskStatus] ?? 'background-color: #9CA3AF;';
                
                $messageContent = "
                    <style>{$styles}</style>
                    <div class='card'>
                        <h2 style='color: #1f2937; margin-top: 0;'>Nouvelle tâche dans le projet <strong>{$projectName}</strong></h2>
                        <h3 style='color: #374151;'>{$taskTitle}</h3>
                        
                        <div style='background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                            <p style='margin: 8px 0;'><strong>📝 Description :</strong> {$taskDescription}</p>
                            
                            <div style='display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;'>
                                <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; {$statusBadgeColor} color: white;'>
                                    {$taskStatus}
                                </span>
                                <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; {$priorityBadgeColor}'>
                                    {$taskPriority}
                                </span>
                            </div>
                            
                            <div style='margin-top: 10px;'>
                                <p style='margin: 5px 0;'><strong>👤 Assignée à :</strong> {$assignedTo}</p>
                                <p style='margin: 5px 0;'><strong>📅 Échéance :</strong> {$dueDate}</p>
                                <p style='margin: 5px 0;'><strong>👤 Créée par :</strong> {$createdBy}</p>
                            </div>
                        </div>
                        
                        <div style='margin: 20px 0;'>
                            <a href='".($taskId ? route('tasks.show', $taskId) : route('projects.show', $this->data['project_id']))."' 
                               style='background-color: #4F46E5; color: white; padding: 10px 20px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;'>
                                👀 Voir la tâche
                            </a>
                        </div>
                        
                        <div class='footer'>
                            <p>Ceci est une notification automatique, merci de ne pas y répondre.</p>
                        </div>
                    </div>
                ";
                $showActionButton = false;
                $actionText = '👀 Voir la tâche';
                $actionUrl = $taskId ? route('tasks.show', $taskId) : route('projects.show', $this->data['project_id']);
                break;

            case 'task_updated':
                $taskTitle = $this->data['task_title'] ?? 'Tâche mise à jour';
                $newStatus = $this->getStatusText($this->data['task_status'] ?? '') ?? 'Non défini';
                $oldStatus = isset($this->data['old_status']) ? $this->getStatusText($this->data['old_status']) : null;
                $taskPriority = $this->getPriorityText($this->data['task_priority'] ?? '') ?? 'Non définie';
                $assignedTo = $this->data['assigned_to'] ?? 'Non assigné';
                $dueDate = $this->data['due_date'] ?? 'Non définie';
                $updatedBy = $this->data['updated_by'] ?? 'Système';
                $taskId = $this->data['task_id'] ?? null;
                $projectId = $this->data['project_id'];
                
                $priorityBadgeColor = [
                    'Basse' => 'background-color: #10B981; color: white;',
                    'Moyenne' => 'background-color: #F59E0B; color: white;',
                    'Haute' => 'background-color: #EF4444; color: white;',
                    'Non définie' => 'background-color: #9CA3AF; color: white;'
                ][$taskPriority] ?? 'background-color: #9CA3AF; color: white;';
                
                $statusBadgeColor = [
                    'À faire' => 'background-color: #9CA3AF;',
                    'En cours' => 'background-color: #3B82F6;',
                    'Terminé' => 'background-color: #10B981;',
                    'Nouveau' => 'background-color: #8B5CF6;',
                    'En attente' => 'background-color: #F59E0B;'
                ][$newStatus] ?? 'background-color: #9CA3AF;';
                
                $messageContent = "
                    <style>{$styles}</style>
                    <div class='card'>
                        <h2 style='color: #1f2937; margin-top: 0;'>Tâche mise à jour dans le projet <strong>{$projectName}</strong></h2>
                        <h3 style='color: #374151;'>{$taskTitle}</h3>
                        
                        <div style='background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 5px 0; font-weight: 500;'>Statut :</p>";
                
                // Afficher l'ancien et le nouveau statut si disponible
                if ($oldStatus) {
                    $messageContent .= "
                        <div style='display: flex; align-items: center; margin: 5px 0 15px 0;'>
                            <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; background-color: #e5e7eb; color: #4b5563;'>
                                {$oldStatus}
                            </span>
                            <span style='margin: 0 10px; color: #6b7280;'>→</span>
                            <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; {$statusBadgeColor} color: white;'>
                                {$newStatus}
                            </span>
                        </div>";
                } else {
                    $messageContent .= "
                        <div style='margin: 5px 0 15px 0;'>
                            <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; {$statusBadgeColor} color: white;'>
                                {$newStatus}
                            </span>
                        </div>";
                }
                
                $messageContent .= "
                            <div style='display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;'>
                                <span style='padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; {$priorityBadgeColor}'>
                                    {$taskPriority}
                                </span>
                            </div>
                            
                            <div style='margin-top: 10px;'>
                                <p style='margin: 5px 0;'><strong>👤 Assignée à :</strong> {$assignedTo}</p>
                                <p style='margin: 5px 0;'><strong>📅 Échéance :</strong> {$dueDate}</p>
                                <p style='margin: 5px 0;'><strong>🔄 Mise à jour par :</strong> {$updatedBy}</p>
                            </div>
                        </div>";
                
                // Bouton d'action
                $messageContent .= "
                        <div style='margin: 20px 0;'>
                            <a href='".($taskId ? route('tasks.show', $taskId) : route('projects.show', $projectId))."' 
                               style='background-color: #4F46E5; color: white; padding: 10px 20px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;'>
                                👀 Voir la tâche
                            </a>
                        </div>";
                
                // Pied de page
                $messageContent .= "
                        <div class='footer'>
                            <p>Ceci est une notification automatique, merci de ne pas y répondre.</p>";
                
                // Lien de désabonnement si l'utilisateur est connecté
                if (isset($notifiable->id)) {
                    $unsubscribeUrl = route('profile.notifications.unsubscribe', [
                        'user' => $notifiable->id,
                        'type' => 'task_updates',
                        'token' => $notifiable->email_verification_token
                    ]);
                    
                    $messageContent .= "
                            <p style='margin-top: 10px; font-size: 11px; color: #9CA3AF;'>
                                <a href='{$unsubscribeUrl}' style='color: #6B7280;'>
                                    Se désabonner des notifications pour cette tâche
                                </a>
                            </p>";
                }
                
                $messageContent .= "
                        </div>
                    </div>
                ";
                $showActionButton = false;
                $actionText = '👀 Voir la tâche';
                $actionUrl = $taskId ? route('tasks.show', $taskId) : route('projects.show', $projectId);
                break;

            default:
                $messageContent = "Une mise à jour a été effectuée sur le projet.";
                $actionText = null;
                $actionUrl = null;
                break;
        }

        // Création du message MailMessage
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line('') // Ligne vide pour l'espacement
            ->view('emails.notification', [
                'content' => $messageContent,
                'actionText' => $actionText,
                'actionUrl' => $actionUrl,
                'styles' => $styles,
                'footer' => "Ceci est une notification automatique, merci de ne pas y répondre.",
                'showActionButton' => $showActionButton // Contrôle l'affichage du bouton dans la vue
            ]);
        
        return $mailMessage;
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