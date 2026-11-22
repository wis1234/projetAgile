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
        $preferenceKey = $this->data['preference_key'] ?? null;

        if ($preferenceKey && !$notifiable->shouldReceiveNotification($preferenceKey)) {
            return [];
        }

        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject)
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->view('emails.notification', [
                'headerTitle' => $this->data['email_header_title'] ?? 'Notification de votre compte',
                'heading' => e($this->subject),
                'description' => $this->plainTextMessage(),
                'badges' => $this->data['email_badges'] ?? [],
                'metaItems' => $this->data['email_meta_items'] ?? [],
                'actionText' => $this->actionText,
                'actionUrl' => $this->actionUrl,
                'footer' => "Ceci est une notification automatique, merci de ne pas y répondre.",
                'showActionButton' => (bool) $this->actionUrl,
            ]);
    }

    private function plainTextMessage(): string
    {
        $message = preg_replace('/<\s*br\s*\/?\s*>/i', "\n", (string) $this->message);

        return trim(html_entity_decode(strip_tags($message), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
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
