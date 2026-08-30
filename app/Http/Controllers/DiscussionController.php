<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    /**
     * Liste des discussions (une par tâche accessible à l'utilisateur),
     * triée par dernier message reçu, pour l'écran "Discussions" façon WhatsApp.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tasks = Task::query()
            ->select(['id', 'title', 'project_id', 'assigned_to'])
            ->with([
                'project:id,name',
                'latestComment.user:id,name',
            ])
            ->when(!($user->is_admin ?? false), function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('assigned_to', $user->id)
                      ->orWhereHas('project.users', fn ($q2) => $q2->where('users.id', $user->id));
                });
            })
            ->get();

        $result = $tasks
            ->map(function (Task $task) use ($user) {
                $last = $task->latestComment;

                return [
                    'task_id'      => $task->id,
                    'task_title'   => $task->title,
                    'project_id'   => $task->project_id,
                    'project_name' => $task->project?->name,
                    'last_message' => $last ? [
                        'content'    => $last->content,
                        'type'       => $last->audio_path ? 'audio' : ($last->image_path ? 'image' : 'text'),
                        'user_name'  => $last->user->name ?? 'Utilisateur',
                        'is_me'      => $last->user_id === $user->id,
                        'created_at' => $last->created_at,
                    ] : null,
                ];
            })
            // Les discussions avec le message le plus récent en premier ;
            // celles sans aucun message passent tout en bas.
            ->sortByDesc(fn ($t) => $t['last_message']['created_at'] ?? '1970-01-01')
            ->values();

        return response()->json($result);
    }
}