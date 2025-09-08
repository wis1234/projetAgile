<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserActionMailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $subject;
    protected $message;
    protected $actionUrl;
    protected $actionText;
    protected $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($subject, $message, $actionUrl = null, $actionText = null, $data = [])
    {
        $this->subject = $subject;
        $this->message = $message;
        $this->actionUrl = $actionUrl;
        $this->actionText = $actionText;
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
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
        // Utilisation du même template que ProjectNotification pour la cohérence
        $styles = "
            .card { background: #ffffff; border-radius: 8px; border-left: 4px solid #4F46E5; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 20px; margin: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 8px; }
            .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
            .action-button { background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        ";

        // Construction du contenu du message
        $messageContent = "<div style='margin-bottom: 15px;'>{$this->message}</div>";
        
        // Création du message MailMessage avec le template
        return (new MailMessage)
            ->subject($this->subject)
            ->greeting('Salut ' . $notifiable->name . ',')
            ->line('') // Ligne vide pour l'espacement
            ->view('emails.notification', [
                'content' => $messageContent,
                'actionText' => $this->actionText,
                'actionUrl' => $this->actionUrl,
                'styles' => $styles,
                'footer' => "Ceci est une notification automatique, merci de ne pas y répondre.",
                'showActionButton' => (bool)$this->actionUrl // Afficher le bouton uniquement si une URL est fournie
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subject' => $this->subject,
            'message' => $this->message,
            'actionUrl' => $this->actionUrl,
            'actionText' => $this->actionText,
            'data' => $this->data,
        ];
    }
}
