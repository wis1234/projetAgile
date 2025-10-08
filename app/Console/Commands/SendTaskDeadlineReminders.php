<?php

namespace App\Console\Commands;

use App\Models\Task;
use Carbon\Carbon;
use App\Notifications\TaskDeadlineReminder;
use Illuminate\Console\Command;

class SendTaskDeadlineReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-deadline-reminders 
                            {--hours=4 : Nombre d\'heures avant l\'échéance pour envoyer la notification}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie des notifications pour les tâches dont l\'échéance est dans moins de 4 heures';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $now = now();
        $deadline = $now->copy()->addHours($hours);

        $this->info("Recherche des tâches dont l'échéance est avant {$deadline}...");

        $tasks = Task::with(['assignedUser', 'project'])
            ->where('due_date', '<=', $deadline)
            ->where('due_date', '>=', $now)
            ->whereNotIn('status', [
                'done', 'completed', 'annulé', 'terminé', 'terminée',
                'annulée', 'clos', 'fermé', 'fermée', 'closed', 'delivered'
            ])
            ->where('status', '!=', 'done')
            ->where('status', 'not like', '%done%')
            ->where('status', 'not like', '%complete%')
            ->where('status', 'not like', '%terminé%')
            ->where('status', 'not like', '%annulé%')
            ->where('status', 'not like', '%fermé%')
            ->where('status', 'not like', '%clos%')
            ->where(function($query) use ($now) {
                $query->whereNull('deadline_notification_sent_at')
                      ->orWhere('deadline_notification_sent_at', '<=', $now->copy()->subHours(24));
            })
            ->get();

        $this->info(count($tasks) . ' tâches trouvées.');

        foreach ($tasks as $task) {
            if ($task->assignedUser) {
// Vérifier si une notification a déjà été envoyée récemment
                $lastNotification = $task->notifications()
                    ->where('type', 'App\\Notifications\\TaskDeadlineReminder')
                    ->where('created_at', '>=', $now->copy()->subHours(24))
                    ->first();

                if (!$lastNotification) {
                    $task->assignedUser->notify(new TaskDeadlineReminder($task));
                    $task->update(['deadline_notification_sent_at' => $now]);
                }
                $this->info("Notification envoyée pour la tâche #{$task->id} - {$task->title} à {$task->assignedUser->email}");
            }
        }

        $this->info('Traitement des notifications d\'échéance terminé.');
    }
}
