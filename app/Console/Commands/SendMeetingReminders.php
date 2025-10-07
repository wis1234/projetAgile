<?php

namespace App\Console\Commands;

use App\Models\ZoomMeeting;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\MeetingStartedNotification;
use Illuminate\Support\Facades\Notification;

class SendMeetingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'zoom:send-start-notifications {--minutes=1 : Nombre de minutes avant le début pour envoyer la notification}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie des notifications pour les réunions Zoom à venir';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $minutesBefore = (int)$this->option('minutes');
        $windowStart = $now->copy()->addMinutes($minutesBefore);
        $windowEnd = $windowStart->copy()->addMinute();
        
        $this->info("Recherche des réunions entre {$windowStart} et {$windowEnd}");
        
        // Trouver les réunions qui commencent dans la fenêtre de temps
        $meetings = ZoomMeeting::whereBetween('start_time', [$windowStart, $windowEnd])
            ->where('notification_sent', false)
            ->where('start_time', '>', $now) // Ne pas notifier pour les réunions déjà commencées
            ->with('project.users')
            ->get();
            
        $this->info("Trouvé " . $meetings->count() . " réunions à notifier");

        foreach ($meetings as $meeting) {
            try {
                // Récupérer le projet associé à la réunion
                $project = $meeting->project;
                
                if ($project) {
                    // Récupérer tous les utilisateurs du projet
                    $members = $project->users;
                    
                    // Envoyer un email à chaque membre
                    foreach ($members as $member) {
                        Mail::to($member->email)->send(
                            new MeetingStartedNotification($meeting, $project, $member)
                        );
                    }
                    
                    // Marquer que la notification a été envoyée
                    $meeting->update(['notification_sent' => true]);
                    
                    $this->info("Notification envoyée pour la réunion : " . $meeting->topic . " (ID: " . $meeting->id . ")");
                }
            } catch (\Exception $e) {
                $this->error("Erreur lors de l'envoi de la notification pour la réunion " . $meeting->id . ": " . $e->getMessage());
                \Log::error("Erreur d'envoi de notification de réunion", [
                    'meeting_id' => $meeting->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
        
        $this->info('Traitement des notifications de début de réunion terminé.');
    }
}
