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
                    try {
                        // Récupérer tous les utilisateurs du projet via la relation users
                        $users = $project->users()->get();
                        
                        if ($users->isEmpty()) {
                            $this->warn("Aucun utilisateur trouvé pour le projet ID: " . $project->id);
                            continue;
                        }
                        
                        // Envoyer un email à chaque utilisateur
                        foreach ($users as $user) {
                            try {
                                Mail::to($user->email)->send(
                                    new MeetingStartedNotification($meeting, $project, $user)
                                );
                                $this->info("Notification envoyée à " . $user->email . " pour la réunion: " . $meeting->topic);
                            } catch (\Exception $mailException) {
                                $this->error("Erreur d'envoi à " . $user->email . ": " . $mailException->getMessage());
                                \Log::error("Erreur d'envoi de notification à " . $user->email, [
                                    'error' => $mailException->getMessage(),
                                    'trace' => $mailException->getTraceAsString()
                                ]);
                            }
                        }
                        
                        // Marquer que la notification a été envoyée
                        $meeting->update(['notification_sent' => true]);
                        
                        $this->info("Toutes les notifications ont été envoyées pour la réunion : " . $meeting->topic . " (ID: " . $meeting->id . ")");
                    } catch (\Exception $e) {
                        $this->error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage());
                        \Log::error("Erreur de récupération des utilisateurs", [
                            'meeting_id' => $meeting->id,
                            'project_id' => $project->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
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
