<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $task;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Task  $task
     * @return void
     */
    public function __construct(Task $task)
    {
        // Charger les relations nécessaires
        $this->task = $task->load('creator');
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nouvelle Tâche Assignée - ' . $this->task->title)
            ->view('emails.task-assigned', ['task' => $this->task]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'task_assigned',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project->name ?? 'Projet inconnu',
            'assigned_to' => $this->task->assigned_to,
            'assigned_by' => $this->task->created_by ?? 'Système',
            'due_date' => $this->task->due_date,
            'status' => $this->task->status,
            'priority' => $this->task->priority,
        ];
    }
}
