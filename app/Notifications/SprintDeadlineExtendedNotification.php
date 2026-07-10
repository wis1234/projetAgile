<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SprintDeadlineExtendedNotification extends Notification
{
    use Queueable;

    public $sprint;
    public $oldEndDate;
    public $completedTasks;
    public $unfinishedTasks;

    public function __construct($sprint, $oldEndDate, $completedTasks, $unfinishedTasks)
    {
        $this->sprint = $sprint;
        $this->oldEndDate = $oldEndDate;
        $this->completedTasks = $completedTasks;
        $this->unfinishedTasks = $unfinishedTasks;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Alerte : Prolongation du délai du sprint - ' . $this->sprint->name)
            ->markdown('mail.sprint-deadline-extended', [
                'sprint' => $this->sprint,
                'oldEndDate' => $this->oldEndDate,
                'completedTasks' => $this->completedTasks,
                'unfinishedTasks' => $this->unfinishedTasks,
            ]);
    }
}
