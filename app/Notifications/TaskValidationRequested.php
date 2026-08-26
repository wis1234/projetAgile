<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
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
    public function toMail(object $notifiable): MailMessage
    {
        $deliverableName = $this->task->deliverable ? $this->task->deliverable->name : 'Aucun fichier';

        return (new MailMessage)
            ->subject('Demande de validation de tâche : ' . $this->task->title)
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('L\'utilisateur ' . $this->task->assignedUser->name . ' demande la validation de sa tâche.')
            ->line('Tâche : ' . $this->task->title)
            ->line('Livrable : ' . $deliverableName)
            ->action('Voir la tâche', route('tasks.show', $this->task->id))
            ->line('Merci de procéder à la validation dès que possible.');
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
