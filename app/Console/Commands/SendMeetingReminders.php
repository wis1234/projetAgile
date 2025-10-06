<?php

namespace App\Console\Commands;

use App\Models\Meeting;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use App\Notifications\MeetingReminder;

class SendMeetingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'meetings:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie des rappels pour les réunions à venir';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $oneHourFromNow = $now->copy()->addHour();
        
        // Trouver les réunions qui commencent dans 1 heure et n'ont pas encore reçu de rappel
        $meetings = Meeting::whereBetween('start_time', [$now, $oneHourFromNow])
            ->where('reminder_sent', false)
            ->where('start_time', '>', $now)
            ->get();

        foreach ($meetings as $meeting) {
            try {
                // Récupérer le projet associé à la réunion
                $project = Project::find($meeting->project_id);
                
                if ($project) {
                    // Envoyer des notifications à tous les membres du projet
                    foreach ($project->members as $member) {
                        $member->notify(new MeetingReminder($meeting, true));
                    }
                    
                    // Marquer que le rappel a été envoyé
                    $meeting->update(['reminder_sent' => true]);
                    
                    $this->info("Rappel envoyé pour la réunion : " . $meeting->topic);
                }
            } catch (\Exception $e) {
                $this->error("Erreur lors de l'envoi du rappel pour la réunion " . $meeting->id . ": " . $e->getMessage());
            }
        }
        
        $this->info('Traitement des rappels de réunion terminé.');
    }
}
