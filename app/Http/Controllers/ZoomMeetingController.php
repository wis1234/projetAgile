<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ZoomMeeting;
use App\Services\ZoomService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ZoomMeetingController extends Controller
{
    protected $zoomService;

    public function __construct(ZoomService $zoomService)
    {
        $this->zoomService = $zoomService;
        $this->middleware('auth');
    }

    /**
     * Store a newly created meeting in storage.
     */
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'topic' => 'required|string|max:200',
            'start_time' => 'required|date|after_or_equal:now',
            'duration' => 'required|integer|min:1|max:240', // Max 4 hours
            'agenda' => 'nullable|string|max:2000',
        ]);

        try {
            // Formater correctement la date pour Zoom (format ISO 8601)
            $startTime = Carbon::parse($request->start_time);
            if ($startTime->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La date de début doit être dans le futur.'
                ], 422);
            }

            // Créer la réunion via l'API Zoom
            $meetingData = [
                'topic' => $request->topic,
                'start_time' => $startTime->toIso8601String(),
                'duration' => (int)$request->duration,
                'agenda' => $request->agenda ?? 'Réunion pour le projet ' . $project->name,
            ];

            // Récupérer l'email de l'utilisateur Zoom depuis la configuration ou la requête
            $zoomEmail = $request->input('host_email', config('services.zoom.default_user_email'));
            
            if (empty($zoomEmail)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun hôte Zoom configuré. Veuillez configurer un hôte Zoom par défaut ou en spécifier un.'
                ], 422);
            }

            // Récupérer les détails de l'utilisateur Zoom
            $zoomUser = $this->zoomService->getUserByEmail($zoomEmail);
            
            if (!$zoomUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de trouver l\'utilisateur Zoom avec l\'email fourni.'
                ], 422);
            }

            $zoomUserId = $zoomUser['id'];

            // Créer la réunion avec l'ID utilisateur
            $zoomMeeting = $this->zoomService->createMeeting(
                $meetingData,
                $zoomUserId
            );

            // Enregistrer la réunion dans la base de données
            $meeting = new ZoomMeeting([
                'meeting_id' => $zoomMeeting['id'],
                'host_id' => $zoomMeeting['host_id'],
                'topic' => $zoomMeeting['topic'],
                'agenda' => $zoomMeeting['agenda'] ?? null,
                'start_time' => new Carbon($zoomMeeting['start_time']),
                'duration' => $zoomMeeting['duration'],
                'timezone' => $zoomMeeting['timezone'],
                'password' => $zoomMeeting['password'],
                'start_url' => $zoomMeeting['start_url'],
                'join_url' => $zoomMeeting['join_url'],
                'settings' => $zoomMeeting['settings'] ?? null,
            ]);

            $project->zoomMeetings()->save($meeting);

            // Notifier les membres du projet
            $project->notifyMembers('zoom_meeting_created', [
                'meeting_id' => $meeting->id,
                'meeting_topic' => $meeting->topic,
                'start_time' => $meeting->start_time->format('Y-m-d H:i:s'),
                'start_url' => $meeting->start_url,
                'join_url' => $meeting->join_url,
                'user_name' => Auth::user()->name,
            ]);

            return response()->json([
                'success' => true,
                'meeting' => $meeting,
                'message' => 'Réunion Zoom créée avec succès.'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la réunion Zoom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création de la réunion Zoom.'
            ], 500);
        }
    }

    /**
     * Display the specified meeting.
     */
    public function show(Project $project, ZoomMeeting $meeting)
    {
        $this->authorize('view', $project);
        $this->authorize('view', $meeting);

        try {
            $meetingDetails = $this->zoomService->getMeeting($meeting->meeting_id);
            return response()->json([
                'success' => true,
                'meeting' => array_merge($meeting->toArray(), [
                    'details' => $meetingDetails,
                    'is_active' => $meeting->isActive(),
                    'is_upcoming' => $meeting->isUpcoming(),
                    'is_ended' => $meeting->isEnded(),
                ])
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des détails de la réunion Zoom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les détails de la réunion.'
            ], 500);
        }
    }

    /**
     * Get active meeting for a project
     */
    public function active(Project $project)
    {
        $this->authorize('view', $project);

        $meeting = $project->activeZoomMeeting()->first();

        if (!$meeting) {
            return response()->json([
                'success' => true,
                'meeting' => null,
                'message' => 'Aucune réunion active pour ce projet.'
            ]);
        }

        try {
            $meetingDetails = $this->zoomService->getMeeting($meeting->meeting_id);
            
            return response()->json([
                'success' => true,
                'meeting' => array_merge($meeting->toArray(), [
                    'details' => $meetingDetails,
                    'is_active' => $meeting->isActive(),
                    'is_upcoming' => $meeting->isUpcoming(),
                    'is_ended' => $meeting->isEnded(),
                ])
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la réunion active: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les détails de la réunion.'
            ], 500);
        }
    }

    /**
     * End the specified meeting.
     */
    /**
     * Get recent meetings for a project
     */
    public function recent(Project $project)
    {
        $this->authorize('view', $project);

        $meetings = $project->zoomMeetings()
            ->orderBy('start_time', 'desc')
            ->take(4) // Récupère les 5 dernières réunions
            ->get()
            ->map(function ($meeting) {
                return array_merge($meeting->toArray(), [
                    'is_active' => $meeting->isActive(),
                    'is_upcoming' => $meeting->isUpcoming(),
                    'is_ended' => $meeting->isEnded(),
                ]);
            });

        return response()->json([
            'success' => true,
            'meetings' => $meetings
        ]);
    }

    /**
     * End the specified meeting.
     */
    public function end(Project $project, ZoomMeeting $meeting)
    {
        $this->authorize('update', $project);
        $this->authorize('update', $meeting);

        try {
            // Mettre à jour le statut dans la base de données
            $meeting->update(['status' => 'ended']);

            return response()->json([
                'success' => true,
                'message' => 'La réunion a été marquée comme terminée.'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la fermeture de la réunion Zoom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la fermeture de la réunion.'
            ], 500);
        }
    }
}
