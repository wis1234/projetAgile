<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;

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

}
