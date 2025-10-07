<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\ZoomMeeting;
use Illuminate\Support\Facades\Mail;

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
    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject())
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
    /**
     * Get the subject line for the notification.
     *
     * @return string
     */
    public function subject()
    {
        return $this->isReminder 
            ? "🔔 Rappel : Réunion " . $this->meeting->topic . " bientôt"
            : "📅 Nouvelle réunion : " . $this->meeting->topic;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'meeting_id' => $this->meeting->id,
            'is_reminder' => $this->isReminder,
            'topic' => $this->meeting->topic,
            'start_time' => $this->meeting->start_time,
            'join_url' => $this->meeting->join_url
        ];
    }
}
