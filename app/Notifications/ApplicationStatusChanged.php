<?php

namespace App\Notifications;

use App\Models\RecruitmentApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

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

        $subject = "Mise à jour de votre candidature - " . $this->application->recruitment->title;
        
        return (new MailMessage())
            ->subject($subject)
            ->view('emails.application-status', [
                'application' => $this->application,
                'status' => $this->status,
                'statusLabel' => $statusLabels[$this->status] ?? $this->status,
                'notes' => $this->notes,
                'subject' => $subject
            ]);
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
