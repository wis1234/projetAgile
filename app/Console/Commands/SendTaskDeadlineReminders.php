<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use App\Notifications\TaskDeadlineReminder;
use App\Notifications\ProjaNotification;
use Illuminate\Console\Command;

class SendTaskDeadlineReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-deadline-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie les rappels d\'échéance échelonnés (24h, 12h, 6h, 4h, 2h, 1h, 30mn) pour les tâches individuelles et de groupe';

    /**
     * Configuration des paliers de rappel (en minutes avant l'échéance)
     */
    public const MILESTONES = [
        '24h' => [
            'key'         => '24h',
            'max_minutes' => 1440, // 24h
            'min_minutes' => 720,  // > 12h
            'label'       => '24 heures',
            'past_keys'   => [],
        ],
        '12h' => [
            'key'         => '12h',
            'max_minutes' => 720,  // 12h
            'min_minutes' => 360,  // > 6h
            'label'       => '12 heures',
            'past_keys'   => ['24h'],
        ],
        '6h' => [
            'key'         => '6h',
            'max_minutes' => 360,  // 6h
            'min_minutes' => 240,  // > 4h
            'label'       => '6 heures',
            'past_keys'   => ['24h', '12h'],
        ],
        '4h' => [
            'key'         => '4h',
            'max_minutes' => 240,  // 4h
            'min_minutes' => 120,  // > 2h
            'label'       => '4 heures',
            'past_keys'   => ['24h', '12h', '6h'],
        ],
        '2h' => [
            'key'         => '2h',
            'max_minutes' => 120,  // 2h
            'min_minutes' => 60,   // > 1h
            'label'       => '2 heures',
            'past_keys'   => ['24h', '12h', '6h', '4h'],
        ],
        '1h' => [
            'key'         => '1h',
            'max_minutes' => 60,   // 1h
            'min_minutes' => 30,   // > 30m
            'label'       => '1 heure',
            'past_keys'   => ['24h', '12h', '6h', '4h', '2h'],
        ],
        '30m' => [
            'key'         => '30m',
            'max_minutes' => 30,   // 30m
            'min_minutes' => 0,    // >= 0
            'label'       => '30 minutes',
            'past_keys'   => ['24h', '12h', '6h', '4h', '2h', '1h'],
        ],
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $maxWindow = $now->copy()->addHours(24);

        $this->info("Recherche des tâches dont l'échéance est d'ici 24 heures ({$maxWindow})...");

        // Récupérer les tâches actives avec échéance dans les 24 heures
        $tasks = Task::with(['assignedUser', 'assignedUsers', 'project'])
            ->whereNotNull('due_date')
            ->where('due_date', '<=', $maxWindow)
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
            ->get();

        $this->info(count($tasks) . ' tâche(s) trouvée(s) dans la fenêtre de 24h.');

        $sentCount = 0;

        foreach ($tasks as $task) {
            $minutesLeft = $now->diffInMinutes($task->due_date, false);

            if ($minutesLeft < 0) {
                continue; // Déjà expirée
            }

            // Déterminer le palier actif correspondant aux minutes restantes
            $activeMilestone = null;
            foreach (self::MILESTONES as $milestone) {
                if ($minutesLeft <= $milestone['max_minutes'] && $minutesLeft > $milestone['min_minutes']) {
                    $activeMilestone = $milestone;
                    break;
                }
                // Cas frontière : exactement 0 minute
                if ($milestone['key'] === '30m' && $minutesLeft >= 0 && $minutesLeft <= 30) {
                    $activeMilestone = $milestone;
                    break;
                }
            }

            if (!$activeMilestone) {
                continue;
            }

            $currentSent = is_array($task->reminders_sent) ? $task->reminders_sent : [];

            // Si ce palier a déjà été envoyé, on ne le renvoie pas
            if (in_array($activeMilestone['key'], $currentSent, true)) {
                continue;
            }

            // Récupérer tous les destinataires (assigné unique ou tous les membres du groupe)
            $recipients = $task->getAssignedRecipients();

            if ($recipients->isEmpty()) {
                $this->warn("Tâche #{$task->id} ({$task->title}) n'a aucun utilisateur assigné.");
                continue;
            }

            $label = $activeMilestone['label'];
            $this->info("Envoi du rappel [{$activeMilestone['key']}] pour la tâche #{$task->id} (« {$task->title} ») à {$recipients->count()} destinataire(s)...");

            foreach ($recipients as $recipient) {
                try {
                    // Notification e-mail avec intervalle exact
                    $recipient->notify(new TaskDeadlineReminder($task, $label));

                    // Notification Web Push + Base de données
                    $isGroup = $task->isGroup();
                    $prefix = $isGroup ? '👥 Tâche de groupe - ' : '';
                    $recipient->notify(
                        new ProjaNotification(
                            "⏰ {$prefix}Échéance dans {$label}",
                            "La tâche « {$task->title} » arrive à échéance dans {$label}.",
                            '/tasks/' . $task->id
                        )
                    );

                    $this->line("  ✓ Envoyé à {$recipient->email} ({$recipient->name})");
                } catch (\Throwable $e) {
                    $this->error("  ✗ Erreur pour {$recipient->email}: " . $e->getMessage());
                }
            }

            // Marquer ce palier ainsi que les paliers antérieurs (pour éviter les doublons tardifs)
            $newSent = array_values(array_unique(array_merge(
                $currentSent,
                $activeMilestone['past_keys'],
                [$activeMilestone['key']]
            )));

            $task->update([
                'deadline_notification_sent_at' => $now,
                'reminders_sent'                => $newSent,
            ]);

            $sentCount++;
        }

        $this->info("Traitement terminé : {$sentCount} rappel(s) envoyé(s).");
    }
}