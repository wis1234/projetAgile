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
        $main = '<div style="font-size:1.1rem;color:#334155;margin-bottom:24px;">' . $this->message . '</div>';
        if ($this->actionUrl && $this->actionText) {
            $main .= '<div style="text-align:center;margin:32px 0;">
                <a href="' . $this->actionUrl . '" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;font-size:1rem;">' . $this->actionText . '</a>
            </div>';
        }
        $mail = (new MailMessage)
            ->subject($this->subject)
            ->line(new \Illuminate\Support\HtmlString($main));
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
