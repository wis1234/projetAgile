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
    protected $signature = 'zoom:send-start-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie des notifications quand une réunion Zoom commence';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        
        // Trouver les réunions qui commencent maintenant (à la minute près)
        $meetings = ZoomMeeting::where('start_time', '<=', $now)
            ->where('started_notification_sent', false)
            ->where(function($query) use ($now) {
                // Vérifier que la réunion n'est pas terminée (dans les 24h pour éviter les faux positifs)
                $query->whereRaw('DATE_ADD(start_time, INTERVAL duration MINUTE) >= ?', [$now->copy()->subDay()])
                      ->whereRaw('DATE_ADD(start_time, INTERVAL duration MINUTE) >= ?', [$now]);
            })
            ->with('project.users')
            ->get();

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
                    $meeting->update(['started_notification_sent' => true]);
                    
                    $this->info("Notification de début envoyée pour la réunion : " . $meeting->topic);
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
