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
use App\Notifications\MeetingReminder;

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
        try {
            $request->validate([
                'topic' => 'required|string|max:200',
                'start_time' => 'required|date|after_or_equal:now',
                'duration' => 'required|integer|min:1|max:240', // Max 4 heures
                'agenda' => 'nullable|string|max:2000',
                'is_reminder' => 'sometimes|boolean',
            ]);

            // Formater correctement la date pour Zoom (format ISO 8601)
            $startTime = Carbon::parse($request->start_time);
            if ($startTime->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La date de début doit être dans le futur.'
                ], 422);
            }

            // Préparer l'agenda avec une valeur par défaut si vide
            $agenda = $request->agenda ?: 'Réunion pour le projet ' . $project->name;
            
            // Créer la réunion via l'API Zoom
            $meetingData = [
                'topic' => $request->topic,
                'start_time' => $startTime->toIso8601String(),
                'duration' => (int)$request->duration,
                'agenda' => $agenda,
                'settings' => [
                    'host_video' => true,
                    'participant_video' => true,
                    'join_before_host' => false,
                    'mute_upon_entry' => false,
                    'waiting_room' => true,
                ]
            ];

            Log::info('Tentative de création de réunion Zoom avec les données:', $meetingData);

            // Récupérer l'email de l'utilisateur Zoom depuis la configuration ou la requête
            $zoomEmail = $request->input('host_email', config('services.zoom.default_user_email'));
            
            if (empty($zoomEmail)) {
                $error = 'Aucun hôte Zoom configuré. Veuillez configurer un hôte Zoom par défaut dans le fichier .env ou spécifiez un email d\'hôte.';
                Log::error($error);
                return response()->json([
                    'success' => false,
                    'message' => $error
                ], 422);
            }

            Log::info('Récupération des détails de l\'utilisateur Zoom avec l\'email: ' . $zoomEmail);

            // Récupérer les détails de l'utilisateur Zoom
            try {
                $zoomUser = $this->zoomService->getUserByEmail($zoomEmail);
                
                if (!$zoomUser || !isset($zoomUser['id'])) {
                    $error = 'Impossible de trouver l\'utilisateur Zoom avec l\'email fourni ou format de réponse invalide.';
                    Log::error($error, ['response' => $zoomUser]);
                    return response()->json([
                        'success' => false,
                        'message' => $error
                    ], 422);
                }

                $zoomUserId = $zoomUser['id'];
                Log::info('ID utilisateur Zoom récupéré: ' . $zoomUserId);

                // Créer la réunion avec l'ID utilisateur
                Log::info('Tentative de création de la réunion via l\'API Zoom...');
                $zoomMeeting = $this->zoomService->createMeeting(
                    $meetingData,
                    $zoomUserId
                );

                if (!isset($zoomMeeting['id'])) {
                    $error = 'Réponse inattendue de l\'API Zoom lors de la création de la réunion.';
                    Log::error($error, ['response' => $zoomMeeting]);
                    return response()->json([
                        'success' => false,
                        'message' => $error,
                        'zoom_response' => $zoomMeeting
                    ], 500);
                }

                Log::info('Réunion Zoom créée avec succès', ['meeting_id' => $zoomMeeting['id']]);

                // Enregistrer la réunion dans la base de données
                $meeting = new ZoomMeeting([
                    'project_id' => $project->id,
                    'meeting_id' => $zoomMeeting['id'],
                    'host_id' => $zoomMeeting['host_id'] ?? $zoomUserId,
                    'topic' => $zoomMeeting['topic'] ?? $request->topic,
                    'agenda' => $zoomMeeting['agenda'] ?? $agenda,
                    'start_time' => new Carbon($zoomMeeting['start_time'] ?? $startTime),
                    'duration' => $zoomMeeting['duration'] ?? (int)$request->duration,
                    'timezone' => $zoomMeeting['timezone'] ?? config('app.timezone'),
                    'password' => $zoomMeeting['password'] ?? '',
                    'start_url' => $zoomMeeting['start_url'] ?? '',
                    'join_url' => $zoomMeeting['join_url'] ?? '',
                    'settings' => $zoomMeeting['settings'] ?? null,
                ]);

                Log::info('Sauvegarde de la réunion dans la base de données...', $meeting->toArray());

                // Sauvegarder la réunion dans la base de données
                if (!$meeting->save()) {
                    throw new \Exception('Échec de la sauvegarde de la réunion dans la base de données.');
                }
                
                // Recharger la relation pour s'assurer que toutes les propriétés sont disponibles
                $meeting->refresh();
                Log::info('Réunion enregistrée avec succès', ['id' => $meeting->id]);

                // Envoyer des notifications aux membres du projet
                if ($project->users && $project->users->isNotEmpty()) {
                    $isReminder = $request->boolean('is_reminder', false);
                    Log::info('Envoi des notifications aux membres du projet', [
                        'project_id' => $project->id,
                        'user_count' => $project->users->count(),
                        'is_reminder' => $isReminder
                    ]);

                    foreach ($project->users as $user) {
                        try {
                            $notification = new MeetingReminder($meeting, $isReminder);
                            $user->notify($notification);
                            Log::info('Notification envoyée à l\'utilisateur', ['user_id' => $user->id]);
                        } catch (\Exception $e) {
                            Log::warning('Erreur lors de l\'envoi de notification à l\'utilisateur ' . $user->id . ': ' . $e->getMessage());
                        }
                    }
                }

                // Préparer la réponse
                $responseData = [
                    'success' => true,
                    'meeting' => [
                        'id' => $meeting->id,
                        'topic' => $meeting->topic,
                        'start_time' => $meeting->start_time,
                        'duration' => $meeting->duration,
                        'join_url' => $meeting->join_url,
                        'start_url' => $meeting->start_url,
                        'created_at' => $meeting->created_at,
                        'updated_at' => $meeting->updated_at
                    ],
                    'message' => 'Réunion Zoom créée avec succès.'
                ];

                Log::info('Réponse de l\'API de création de réunion', $responseData);
                return response()->json($responseData);

            } catch (\Exception $e) {
                Log::error('Erreur lors de la communication avec l\'API Zoom: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la communication avec le service Zoom: ' . $e->getMessage()
                ], 500);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation: ' . $e->getMessage(), [
                'errors' => $e->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la réunion Zoom: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création de la réunion Zoom: ' . $e->getMessage()
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
     *
     * @param int $projectId
     * @return \Illuminate\Http\JsonResponse
     */
    public function active($projectId)
    {
        try {
            // Récupérer le projet avec vérification d'autorisation
            $project = Project::findOrFail($projectId);
            $this->authorize('view', $project);

            $meeting = $project->zoomMeetings()
                ->where('start_time', '<=', now())
                ->whereRaw('DATE_ADD(start_time, INTERVAL duration MINUTE) >= ?', [now()])
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => true,
                    'meeting' => null
                ]);
            }

            $startTime = $meeting->start_time;
            $endTime = $startTime ? $startTime->copy()->addMinutes($meeting->duration) : null;
            $now = now();
            
            $isActive = $startTime && $endTime && $now->between($startTime, $endTime);
            $isUpcoming = $startTime && $now->lt($startTime);
            $isEnded = $endTime && $now->gt($endTime);

            $meetingData = [
                'id' => $meeting->id,
                'meeting_id' => $meeting->meeting_id,
                'topic' => $meeting->topic,
                'agenda' => $meeting->agenda ?? 'Réunion Zoom pour le projet ' . $project->name,
                'start_time' => $startTime ? $startTime->toIso8601String() : null,
                'duration' => $meeting->duration,
                'timezone' => $meeting->timezone,
                'join_url' => $meeting->join_url,
                'start_url' => $meeting->start_url,
                'password' => $meeting->password,
                'is_active' => $isActive,
                'is_upcoming' => $isUpcoming,
                'is_ended' => $isEnded,
                'formatted_start_time' => $startTime ? $startTime->format('Y-m-d H:i:s') : null,
                'formatted_date' => $startTime ? $startTime->isoFormat('DD MMM YYYY') : null,
                'formatted_time' => $startTime ? $startTime->format('H:i') : null,
                'end_time' => $endTime ? $endTime->toIso8601String() : null,
                'formatted_end_time' => $endTime ? $endTime->format('H:i') : null,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name
                ]
            ];

            return response()->json([
                'success' => true,
                'meeting' => $meetingData
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active meeting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les détails de la réunion.'
            ], 500);
        }
    }

    /**
     * Get recent meetings for a project
     *
     * @param int $projectId
     * @return \Illuminate\Http\JsonResponse
     */
    public function recent($projectId)
    {
        try {
            // Récupérer le projet avec vérification d'autorisation
            $project = Project::findOrFail($projectId);
            $this->authorize('view', $project);

            $meetings = $project->zoomMeetings()
                ->where('start_time', '>=', now())
                ->orderBy('start_time', 'asc')
                ->take(3)
                ->get()
                ->map(function ($meeting) use ($project) {
                    $startTime = $meeting->start_time;
                    $endTime = $startTime ? $startTime->copy()->addMinutes($meeting->duration) : null;
                    $now = now();
                    
                    $isActive = $startTime && $endTime && $now->between($startTime, $endTime);
                    $isUpcoming = $startTime && $now->lt($startTime);
                    $isEnded = $endTime && $now->gt($endTime);
                    
                    return [
                        'id' => $meeting->id,
                        'meeting_id' => $meeting->meeting_id,
                        'topic' => $meeting->topic,
                        'agenda' => $meeting->agenda ?? 'Réunion Zoom pour le projet ' . $project->name,
                        'start_time' => $startTime ? $startTime->toIso8601String() : null,
                        'duration' => $meeting->duration,
                        'timezone' => $meeting->timezone,
                        'join_url' => $meeting->join_url,
                        'start_url' => $meeting->start_url,
                        'password' => $meeting->password,
                        'is_active' => $isActive,
                        'is_upcoming' => $isUpcoming,
                        'is_ended' => $isEnded,
                        'formatted_start_time' => $startTime ? $startTime->format('Y-m-d H:i:s') : null,
                        'formatted_date' => $startTime ? $startTime->isoFormat('DD MMM YYYY') : null,
                        'formatted_time' => $startTime ? $startTime->format('H:i') : null,
                        'end_time' => $endTime ? $endTime->toIso8601String() : null,
                        'formatted_end_time' => $endTime ? $endTime->format('H:i') : null,
                        'project' => [
                            'id' => $project->id,
                            'name' => $project->name
                        ]
                    ];
                });

            return response()->json([
                'success' => true,
                'meetings' => $meetings
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching recent meetings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent meetings.',
                'error' => $e->getMessage()
            ], 500);
        }
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