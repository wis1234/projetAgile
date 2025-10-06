<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\ZoomMeeting;

class MeetingReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $meeting;
    protected $isReminder;

    /**
     * Create a new notification instance.
     *
     * @param ZoomMeeting $meeting
     * @param bool $isReminder
     * @return void
     */
    public function __construct(ZoomMeeting $meeting, $isReminder = false)
    {
        $this->meeting = $meeting;
        $this->isReminder = $isReminder;
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
    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $meeting = $this->meeting;
        
        $subject = $this->isReminder 
            ? "🔔 Rappel : Réunion " . $meeting->topic . " bientôt"
            : "📅 Nouvelle réunion : " . $meeting->topic;
            
        return (new MailMessage)
            ->subject($subject)
            ->view('emails.meeting-reminder', [
                'meeting' => $this->meeting,
                'isReminder' => $this->isReminder,
                'user' => $notifiable
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
            //
        ];
    }
}
