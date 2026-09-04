<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\CallSession;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use Agence104\LiveKit\RoomServiceClient;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\FcmService;


class LiveKitController extends Controller
{
    /**
     * Génère un token LiveKit pour rejoindre une salle liée à une tâche.
     */
    public function livekitToken(Request $request, Task $task)
    {
        $user = $request->user();

        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity((string) $user->id)
            ->setName($user->name)
            ->setTtl(3600); // durée de validité en secondes

        $videoGrant = (new VideoGrant())
            ->setRoomJoin()
            ->setRoomName('task-' . $task->id);

        $token = (new AccessToken(
            config('services.livekit.key'),
            config('services.livekit.secret')
        ))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        return response()->json([
            'token' => $token,
            'url'   => config('services.livekit.url'),
        ]);
    }


    public function livekitTokenForProject(Request $request, \App\Models\Project $project)
    {
        $user = $request->user();

        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity((string) $user->id)
            ->setName($user->name)
            ->setTtl(3600);

        $videoGrant = (new VideoGrant())
            ->setRoomJoin()
            ->setRoomName('project-' . $project->id);

        $token = (new AccessToken(
            config('services.livekit.key'),
            config('services.livekit.secret')
        ))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        return response()->json([
            'token' => $token,
            'url'   => config('services.livekit.url'),
        ]);
    }

    public function notifyCallStarted(Request $request, \App\Models\Project $project)
    {
        $user = $request->user();
        $memberIds = $project->users()->pluck('users.id')->toArray();

        // Récupérer ou créer la session d'appel
        $session = CallSession::where('project_id', $project->id)
            ->active()
            ->first();

        $inviteUrl = $session ? $session->getInviteUrl() : '';

        event(new \App\Events\LiveKitCallStarted(
            $project->id, $project->name, $user->id, $user->name, $memberIds, $inviteUrl
        ));

        $this->sendNativeCallNotifications($project, $user, $inviteUrl);

        activity_log('call_started', "Appel ProJA démarré sur « {$project->name} »", $project);

        return response()->json(['status' => 'ok']);
    }

    public function notifyCallEnded(Request $request, \App\Models\Project $project)
    {
        $user = $request->user();
        $memberIds = $project->users()->pluck('users.id')->toArray();

        // Expirer toutes les sessions actives de ce projet
        CallSession::where('project_id', $project->id)
            ->active()
            ->each(fn($session) => $session->expire());

        event(new \App\Events\LiveKitCallEnded($project->id, $user->id, $memberIds));

        activity_log('call_ended', "Appel ProJA terminé sur « {$project->name} »", $project);

        return response()->json(['status' => 'ok']);
    }

    public function notifyCallAnswered(Request $request, \App\Models\Project $project)
    {
        $memberIds = $project->users()->pluck('users.id')->toArray();
        event(new \App\Events\LiveKitCallAnswered($project->id, $memberIds));

        activity_log('call_answered', "Appel ProJA accepté sur « {$project->name} »", $project);

        return response()->json(['status' => 'ok']);
    }


    private function sendNativeCallNotifications(\App\Models\Project $project, $initiator, string $inviteUrl): void
    {
        $call = [
            'projectId' => $project->id,
            'projectName' => $project->name,
            'initiatorName' => $initiator->name,
            'inviteUrl' => $inviteUrl,
        ];

        $project->users()
            ->where('users.id', '!=', $initiator->id)
            ->get()
            ->each(fn ($member) => app(FcmService::class)->sendCallNotification($member, $call));
    }

    private function getRoomService()
    {
        return new RoomServiceClient(
            config('services.livekit.url'),
            config('services.livekit.key'),
            config('services.livekit.secret')
        );
    }

    public function callStatus(Request $request, \App\Models\Project $project)
    {
        $session = CallSession::where('project_id', $project->id)
            ->active()
            ->where('started_at', '>=', now()->subHours(4))
            ->first();

        $active = (bool) $session;
        if (!$active) {
            $roomName = 'project-' . $project->id;
            try {
                $participants = $this->getRoomService()->listParticipants($roomName);
                $active = count($participants) > 0;
            } catch (\Exception $e) {
                $active = false;
            }
        }
        return response()->json(['active' => $active]);
    }

    public function joinOrStartCall(Request $request, \App\Models\Project $project)
    {
        $user = $request->user();
        $roomName = 'project-' . $project->id;

        // Nettoyer les sessions expirées (+ de 4 heures)
        CallSession::where('project_id', $project->id)
            ->active()
            ->where('started_at', '<', now()->subHours(4))
            ->each(fn($s) => $s->expire());

        // Récupérer la session d'appel active existante
        $session = CallSession::where('project_id', $project->id)
            ->active()
            ->latest('started_at')
            ->first();

        $memberIds = $project->users()->pluck('users.id')->toArray();
        $isNewCall = false;

        if (!$session) {
            // C'est un nouveau démarrage d'appel par cet utilisateur
            $session = CallSession::create([
                'project_id'   => $project->id,
                'initiator_id' => $user->id,
                'room_name'    => $roomName,
                'invite_token' => CallSession::generateToken(),
                'invite_code'  => CallSession::generateCode(),
                'status'       => 'active',
                'started_at'   => now(),
            ]);
            $isNewCall = true;
        }

        if ($isNewCall) {
            // Uniquement pour le vrai créateur de l'appel au tout début
            event(new \App\Events\LiveKitCallStarted(
                $project->id, $project->name, $user->id, $user->name, $memberIds, $session->getInviteUrl()
            ));

            $this->sendNativeCallNotifications($project, $user, $session->getInviteUrl());
            activity_log('call_started', "{$user->name} a démarré un appel ProJA Meet sur « {$project->name} »", $project);
        } else {
            // L'appel existe déjà : ce membre le rejoint (décrochage ou intégration en retard)
            // On signale que l'appel a été décroché (pour stopper la sonnerie d'attente de l'appelant)
            event(new \App\Events\LiveKitCallAnswered($project->id, $memberIds));

            // On notifie les autres participants que quelqu'un a rejoint
            if ($session->initiator_id !== $user->id) {
                event(new \App\Events\LiveKitParticipantJoined(
                    $project->id, $project->name, $user->id, $user->name, $memberIds
                ));
            }

            activity_log('call_answered', "{$user->name} a rejoint l'appel ProJA Meet sur « {$project->name} »", $project);
        }

        return response()->json([
            'alreadyActive' => !$isNewCall,
            'isInitiator'   => $session->initiator_id === $user->id,
            'inviteUrl'     => $session->getInviteUrl(),
            'inviteCode'    => $session->invite_code,
        ]);
    }

    /**
     * Retourne le lien d'invitation de la session active pour ce projet.
     */
    public function getInviteLink(Request $request, \App\Models\Project $project)
    {
        $session = CallSession::where('project_id', $project->id)
            ->active()
            ->first();

        if (!$session) {
            return response()->json(['inviteUrl' => null], 404);
        }

        return response()->json([
            'inviteUrl'  => $session->getInviteUrl(),
            'inviteCode' => $session->invite_code,
        ]);
    }

    /**
     * Page d'accès invité via le lien d'invitation.
     * - Si l'utilisateur est authentifié → redirige vers la page projet avec auto-join.
     * - Sinon → affiche le formulaire invité.
     */
    public function guestJoinPage(string $token)
    {
        $session = CallSession::where('invite_token', $token)->first();

        if (!$session) {
            return Inertia::render('Meet/GuestJoin', [
                'error' => 'link_invalid',
                'expired' => true,
            ]);
        }

        if (!$session->isActive()) {
            return Inertia::render('Meet/GuestJoin', [
                'error' => 'call_ended',
                'expired' => true,
                'projectName' => $session->project->name ?? 'ProJA',
            ]);
        }

        // Si l'utilisateur est connecté, le rediriger vers la page projet
        if (Auth::check()) {
            return redirect('/projects/' . $session->project_id . '?join-call=1');
        }

        // Sinon, afficher la page invité
        return Inertia::render('Meet/GuestJoin', [
            'expired'     => false,
            'token'       => $token,
            'projectName' => $session->project->name ?? 'ProJA',
            'inviteCode'  => $session->invite_code,
        ]);
    }

    /**
     * Génère un token LiveKit pour un invité externe (sans compte ProJA).
     */
    public function guestToken(Request $request, string $token)
    {
        $request->validate([
            'guest_name' => 'required|string|max:50',
        ]);

        $session = CallSession::where('invite_token', $token)
            ->active()
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Cet appel est terminé ou le lien est invalide.'], 403);
        }

        $guestName = $request->input('guest_name');
        $guestIdentity = 'guest-' . uniqid();

        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity($guestIdentity)
            ->setName('Invité — ' . $guestName)
            ->setTtl(3600);

        $videoGrant = (new VideoGrant())
            ->setRoomJoin()
            ->setRoomName($session->room_name);

        $livekitToken = (new AccessToken(
            config('services.livekit.key'),
            config('services.livekit.secret')
        ))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        return response()->json([
            'token' => $livekitToken,
            'url'   => config('services.livekit.url'),
        ]);
    }

    public function muteParticipant(Request $request, \App\Models\Project $project)
    {
        $user = $request->user();
        $userRoles = $user->roles ?? [];
        $isAdmin = ($user->role === 'admin' || $user->is_admin) ||
            (is_array($userRoles) && collect($userRoles)->contains(fn($r) => ($r->name ?? $r) === 'admin'));
        $isManager = $project->managers()->where('users.id', $user->id)->exists();

        if (!$isAdmin && !$isManager) {
            abort(403, 'Seul l\'hôte peut couper le micro/caméra des participants.');
        }

        $validated = $request->validate([
            'identity' => 'required|string',
            'trackSid' => 'required|string',
        ]);

        $roomName = 'project-' . $project->id;

        try {
            $this->getRoomService()->mutePublishedTrack(
                $roomName, $validated['identity'], $validated['trackSid'], true
            );
        } catch (\Exception $e) {
            return response()->json(['message' => 'Impossible de couper ce flux.'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

}