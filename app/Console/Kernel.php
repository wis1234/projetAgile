<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Exécute la file d'attente toutes les minutes
        $schedule->command('queue:work --stop-when-empty')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->sendOutputTo(storage_path('logs/queue-worker.log'));
                 
        // Vérifie et ferme les offres expirées toutes les 5 minutes
        $schedule->command('recruitments:close-expired')
                 ->everyFiveMinutes()
                 ->withoutOverlapping()
                 ->sendOutputTo(storage_path('logs/recruitments-close.log'));
                 
        // Envoie des rappels pour les réunions à venir
        $schedule->command('meetings:send-reminders')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->sendOutputTo(storage_path('logs/meeting-reminders.log'));
                 
        // Envoie des notifications quand une réunion commence
        $schedule->command('zoom:send-start-notifications')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->sendOutputTo(storage_path('logs/zoom-start-notifications.log'));
                 
        // Envoie des notifications pour les tâches dont l'échéance approche
        $schedule->command('tasks:send-deadline-reminders')
                 ->everyFiveMinutes()
                 ->withoutOverlapping()
                 ->sendOutputTo(storage_path('logs/task-deadline-reminders.log'));
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
