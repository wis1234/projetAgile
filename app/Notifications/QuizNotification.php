<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class QuizNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $type;
    public array $data;

    public function __construct(string $type, array $data = [])
    {
        $this->type = $type;
        $this->data = $data;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        $title = match($this->type) {
            'quiz_created' => 'Nouveau Quiz dans ' . ($this->data['project_name'] ?? 'votre projet'),
            'quiz_graded' => 'Quiz corrigé : ' . ($this->data['quiz_title'] ?? 'Quiz'),
            default => 'Notification Quiz',
        };

        $message = match($this->type) {
            'quiz_created' => 'Le quiz "' . ($this->data['quiz_title'] ?? '') . '" a été publié par ' . ($this->data['creator_name'] ?? 'un membre') . '.',
            'quiz_graded' => 'Votre réponse écrite a été notée. Votre score final est de ' . ($this->data['score'] ?? 0) . '%.',
            default => $this->data['message'] ?? '',
        };

        return [
            'type' => $this->type,
            'title' => $title,
            'message' => $message,
            'quiz_id' => $this->data['quiz_id'] ?? null,
            'project_id' => $this->data['project_id'] ?? null,
            'url' => $this->data['url'] ?? '/dashboard',
        ];
    }
}
