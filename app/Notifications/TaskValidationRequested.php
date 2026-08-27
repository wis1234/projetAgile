<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskValidationRequested extends Notification
{
    use Queueable;

    protected $task;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable)
    {
        $task = $this->task;

        return (new MailMessage)
            ->subject('Demande de validation de tâche : ' . $task->title)
            ->view('emails.task-validation-requested', compact('task', 'notifiable'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => 'Demande de validation',
            'message' => $this->task->assignedUser->name . ' a soumis la tâche "' . $this->task->title . '" pour validation.',
            'url' => route('tasks.show', $this->task->id, false),
            'tag' => 'task_validation',
        ];
    }
}