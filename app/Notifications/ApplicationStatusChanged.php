<?php

namespace App\Notifications;

use App\Models\RecruitmentApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    protected $application;
    protected $status;
    protected $notes;

    /**
     * Create a new notification instance.
     */
    public function __construct(RecruitmentApplication $application, string $status, ?string $notes = null)
    {
        $this->application = $application;
        $this->status = $status;
        $this->notes = $notes;
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
        $statusLabels = [
            'pending' => 'en attente de traitement',
            'reviewed' => 'en cours d\'examen',
            'interviewed' => 'retenue pour un entretien',
            'accepted' => 'acceptée',
            'rejected' => 'refusée',
        ];

        $statusLabel = $statusLabels[$this->status] ?? $this->status;
        $subject = "Mise à jour de votre candidature - " . $this->application->recruitment->title;
        
        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour ' . $this->application->first_name . ',')
            ->line('Nous vous informons que le statut de votre candidature pour le poste de **' . $this->application->recruitment->title . '** a été mis à jour.')
            ->line('**Nouveau statut :** Votre candidature est ' . $statusLabel . '.');

        // Ajouter des informations supplémentaires en fonction du statut
        switch ($this->status) {
            case 'interviewed':
                $mail->line('**Prochaine étape :** Notre équipe vous contactera bientôt pour planifier un entretien.');
                break;
                
            case 'accepted':
                $mail->line('**Félicitations !** Nous sommes ravis de vous annoncer que votre profil a retenu toute notre attention.')
                     ->line('Notre équipe des ressources humaines prendra contact avec vous sous peu pour les démarches à suivre.');
                break;
                
            case 'rejected':
                $mail->line('Nous tenons à vous remercier pour l\'intérêt que vous avez porté à notre entreprise.')
                     ->line('Malheureusement, votre profil ne correspond pas exactement à nos attentes pour ce poste.');
                break;
        }

        // Ajouter les notes supplémentaires si elles existent
        if (!empty($this->notes)) {
            $mail->line('')
                 ->line('**Message complémentaire :**')
                 ->line($this->notes);
        }

        // Pied de page standard
        $mail->line('')
             ->line('Nous vous remercions pour votre confiance et l\'intérêt que vous portez à notre entreprise.')
             ->salutation('Cordialement,')
             ->line('Le service des Ressources Humaines')
             ->line(config('app.name'))
             ->line('')
             ->line('*Ceci est un message automatique, merci de ne pas y répondre directement.*');

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'status' => $this->status,
            'message' => 'Le statut de votre candidature a été mis à jour : ' . $this->status
        ];
    }
}
