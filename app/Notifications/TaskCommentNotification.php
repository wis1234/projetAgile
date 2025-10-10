<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;
use App\Models\TaskComment;

class TaskCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $task;
    public $comment;
    public $commenter;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Task  $task
     * @param  \App\Models\TaskComment  $comment
     * @return void
     */
    public function __construct(Task $task, TaskComment $comment)
    {
        $this->task = $task->load('project');
        $this->comment = $comment->load('user');
        $this->commenter = $comment->user;
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
            ->subject('Nouveau commentaire sur la tâche : ' . $this->task->title)
            ->view('emails.task-comment', [
                'task' => $this->task,
                'comment' => $this->comment,
                'user' => $notifiable
            ]);
    }

    /**
     * Get the array representation of the notification for database storage.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'task_comment',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'comment_id' => $this->comment->id,
            'comment_content' => $this->comment->content,
            'commenter_id' => $this->commenter->id,
            'commenter_name' => $this->commenter->name,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project->name ?? 'Projet inconnu',
            'created_at' => now()->toDateTimeString(),
        ];
    }
}
