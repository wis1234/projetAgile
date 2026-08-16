<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use Agence104\LiveKit\RoomServiceClient;


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

    event(new \App\Events\LiveKitCallStarted(
        $project->id, $project->name, $user->id, $user->name, $memberIds
    ));

    activity_log('call_started', "Appel ProJA démarré sur « {$project->name} »", $project);

    return response()->json(['status' => 'ok']);
}

public function notifyCallEnded(Request $request, \App\Models\Project $project)
{
    $user = $request->user();
    $memberIds = $project->users()->pluck('users.id')->toArray();

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
    $roomName = 'project-' . $project->id;
    try {
        $participants = $this->getRoomService()->listParticipants($roomName);
        $active = count($participants) > 0;
    } catch (\Exception $e) {
        $active = false;
    }
    return response()->json(['active' => $active]);
}

public function joinOrStartCall(Request $request, \App\Models\Project $project)
{
    $user = $request->user();
    $roomName = 'project-' . $project->id;

    try {
        $participants = $this->getRoomService()->listParticipants($roomName);
        $alreadyActive = count($participants) > 0;
    } catch (\Exception $e) {
        $alreadyActive = false;
    }

    $memberIds = $project->users()->pluck('users.id')->toArray();

    if (!$alreadyActive) {
        // Personne n'est encore dans l'appel : c'est un vrai démarrage,
        // les autres membres reçoivent l'invite avec sonnerie.
        event(new \App\Events\LiveKitCallStarted(
            $project->id, $project->name, $user->id, $user->name, $memberIds
        ));
    } else {
        // L'appel existe déjà : ce membre le rejoint simplement, en retard.
        // Les autres reçoivent une notification discrète, sans sonnerie
        // ni écran "appel entrant".
        event(new \App\Events\LiveKitParticipantJoined(
            $project->id, $project->name, $user->id, $user->name, $memberIds
        ));
    }

    activity_log('call_answered', "{$user->name} a rejoint l'appel ProJA Meet sur « {$project->name} »", $project);

    return response()->json(['alreadyActive' => $alreadyActive]);
}

public function muteParticipant(Request $request, \App\Models\Project $project)
{
    $user = $request->user();
    $userRoles = $user->roles ?? [];
    $isAdmin = ($user->role === 'admin' || $user->is_admin) ||
        (is_array($userRoles) && collect($userRoles)->contains(fn($r) => ($r->name ?? $r) === 'admin'));
    $isManager = $project->managers()->where('users.id', $user->id)->exists();

    if (!$isAdmin && !$isManager) {
        abort(403, 'Seul l’hôte peut couper le micro/caméra des participants.');
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
