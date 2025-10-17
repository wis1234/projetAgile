<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;
use App\Models\File;

class TaskFileUploadNotification extends Notification
{
    use Queueable;

    protected $task;
    protected $file;
    protected $uploader;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task, File $file, $uploader)
    {
        $this->task = $task;
        $this->file = $file;
        $this->uploader = $uploader;
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
    public function toMail(object $notifiable)
    {
        $task = $this->task;
        $file = $this->file;
        $uploader = $this->uploader;
        
        return (new MailMessage)
            ->subject("Nouveau fichier sur la tâche : " . $task->title)
            ->view('emails.task-file-upload', compact('task', 'file', 'uploader'));
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
            'task_title' => $this->task->title,
            'file_id' => $this->file->id,
            'file_name' => $this->file->name,
            'uploader_id' => $this->uploader->id,
            'uploader_name' => $this->uploader->name,
            'message' => "Un nouveau fichier a été téléversé sur la tâche : " . $this->task->title,
        ];
    }
}
