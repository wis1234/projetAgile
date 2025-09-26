<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class RoleChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $newRole;
    public $oldRole;
    public $changedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct($newRole, $oldRole, $changedBy)
    {
        $this->newRole = $newRole;
        $this->oldRole = $oldRole;
        $this->changedBy = $changedBy;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $roleNames = [
            'admin' => 'Administrateur',
            'manager' => 'Manager',
            'user' => 'Utilisateur',
            'member' => 'Membre',
            'developer' => 'Développeur'
        ];

        $planFeatures = [
            'admin' => [
                'Accès complet à la plateforme',
                'Gestion des utilisateurs et des projets',
                'Statistiques avancées',
                'Support prioritaire',
                'Tableau de bord personnalisé'
            ],
            'manager' => [
                'Gestion des projets et des tâches',
                'Statistiques de projet',
                'Support standard',
                'Accès au stockage sur Dropbox',
                'Accès au panel de recrutement',
                'Accès aux collaborations',
                'Accès au système de chat',
                'Accès aux notifications',
                'Jusqu\'à 5 projets simultanés',
                'Export des données'
            ],
            'user' => [
                'Accès aux projets assignés',
                'Gestion des tâches personnelles',
                'Notifications',
            
            ]
        ];

        $features = $planFeatures[$this->newRole] ?? $planFeatures['user'];
        $newRoleName = $roleNames[$this->newRole] ?? $this->newRole;
        $oldRoleName = $roleNames[$this->oldRole] ?? $this->oldRole;

        return (new MailMessage)
            ->subject('Mise à jour de votre abonnement - ' . config('app.name'))
            ->greeting('Bonjour ' . $notifiable->name . ' !')
            ->line('Bienvenue sur ProJA.  Suite à votre abonnement,')
            ->line('Votre niveau d\'accès a été mis à jour par les administrateurs') 
            ->line(new HtmlString('<div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">'))
            ->line(new HtmlString('<p style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b;"><strong>Détails du changement :</strong></p>'))
            ->line(new HtmlString('<p style="margin: 5px 0; color: #64748b;"><span style="display: inline-block; width: 100px;">Ancien :</span> <strong>' . $oldRoleName . '</strong></p>'))
            ->line(new HtmlString('<p style="margin: 5px 0; color: #64748b;"><span style="display: inline-block; width: 100px;">Nouveau:</span> <strong style="color: #10b981;">' . $newRoleName . '</strong></p>'))
            ->line(new HtmlString('</div>'))
            ->line('Votre nouvel abonnement vous donne accès aux fonctionnalités suivantes :')
            ->line(new HtmlString('<ul style="margin: 15px 0 25px 0; padding-left: 20px; color: #334155;">' . 
                implode('', array_map(fn($feature) => "<li style='margin-bottom: 8px;'><span style='color: #3b82f6;'>&#10004;</span> {$feature}</li>", $features)) . 
                '</ul>'))
            ->action('Accéder à mon compte', url('/dashboard'))
            ->line('Si vous avez des questions concernant ce changement, n\'hésitez pas à nous contacter.')
            ->salutation('Cordialement');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'new_role' => $this->newRole,
            'old_role' => $this->oldRole,
            'changed_by' => $this->changedBy->id,
            'changed_by_name' => $this->changedBy->name,
        ];
    }
}
