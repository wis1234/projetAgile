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
            'deliberation_opened' => 'Délibération ouverte : ' . ($this->data['quiz_title'] ?? 'Quiz'),
            'deliberation_reopened' => 'Délibération rouverte : ' . ($this->data['quiz_title'] ?? 'Quiz'),
            'results_validated' => 'Résultats validés : ' . ($this->data['quiz_title'] ?? 'Quiz'),
            'results_validated_candidate' => 'Résultats officiels disponibles : ' . ($this->data['quiz_title'] ?? 'Quiz'),
            default => 'Notification Quiz',
        };

        $message = match($this->type) {
            'quiz_created' => 'Le quiz "' . ($this->data['quiz_title'] ?? '') . '" a été publié par ' . ($this->data['creator_name'] ?? 'un membre') . '.',
            'quiz_graded' => 'Votre réponse écrite a été notée. Votre score final est de ' . ($this->data['score'] ?? 0) . '%.',
            'deliberation_opened' => ($this->data['actor_name'] ?? 'Un responsable') . ' a ouvert la délibération : votre aval est attendu.',
            'deliberation_reopened' => ($this->data['actor_name'] ?? 'Un responsable') . ' a rouvert la délibération : les avals précédents sont annulés.',
            'results_validated' => 'Tous les responsables ont donné leur aval : les résultats sont officiels.',
            'results_validated_candidate' => 'Les résultats officiels de ce quiz sont désormais validés.',
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
