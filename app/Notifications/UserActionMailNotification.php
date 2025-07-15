<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserActionMailNotification extends Notification
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
        $mail = (new MailMessage)
            ->subject($this->subject)
            ->greeting('Hello!')
            ->line(new \Illuminate\Support\HtmlString($this->message))
            ->when($this->actionUrl && $this->actionText, function($mail) {
                return $mail->action($this->actionText, $this->actionUrl);
            })
            ->line('Regards,')
            ->line('Agile');
        if ($this->actionUrl && $this->actionText) {
            $mail->line('If you\'re having trouble clicking the "' . $this->actionText . '" button, copy and paste the URL below into your web browser:')
                ->line($this->actionUrl);
        }
        return $mail;
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
