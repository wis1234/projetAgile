<?php
namespace App\Notifications;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
class TaskDeadlineReminder extends Notification implements ShouldQueue
{
    use Queueable;
    public $task;
    public ?string $intervalLabel;

    public function __construct(Task $task, ?string $intervalLabel = null)
    {
        $this->task = $task;
        $this->intervalLabel = $intervalLabel;
    }
    public function via($notifiable)
    {
        if ($notifiable->shouldReceiveNotification('task_updates')) {
            return ['mail', 'database'];
        }

        return ['database'];
    }
    public function toMail($notifiable)
    {
        if ($this->intervalLabel) {
            $timeLeftString = 'dans ' . $this->intervalLabel;
            $subject = '⏰ Échéance dans ' . $this->intervalLabel . ' : ' . $this->task->title;
        } else {
            $dueDate = \Carbon\Carbon::parse($this->task->due_date);
            
            // Calcul du temps restant en français
            $now = now();
            // Inverser l'ordre pour obtenir un temps restant positif
            $diffInHours = $now->diffInHours($dueDate, false);
            $diffInMinutes = $now->diffInMinutes($dueDate, false) % 60;
            
            $timeLeft = [];
            if ($diffInHours > 0) {
                $timeLeft[] = $diffInHours . ' heure' . ($diffInHours > 1 ? 's' : '');
                if ($diffInMinutes > 0) {
                    $timeLeft[] = $diffInMinutes . ' minute' . ($diffInMinutes > 1 ? 's' : '');
                }
            } else {
                $timeLeft[] = max(1, $diffInMinutes) . ' minute' . ($diffInMinutes > 1 ? 's' : '');
            }
            
            $timeLeftString = 'dans ' . implode(' et ', $timeLeft);
            $subject = 'Échéance imminente : ' . $this->task->title;
        }

        return (new MailMessage)
            ->subject($subject)
            ->markdown('emails.task-deadline-reminder', [
                'task' => $this->task,
                'notifiable' => $notifiable,
                'greeting' => 'Bonjour ' . $notifiable->name . ' !',
                'timeLeft' => $timeLeftString
            ]);
    }
    public function toArray($notifiable)
    {
        return [
            'task_id' => $this->task->id,
            'title' => 'Échéance imminente : ' . $this->task->title,
            'due_date' => $this->task->due_date,
            'project_id' => $this->task->project_id,
        ];
    }
}
