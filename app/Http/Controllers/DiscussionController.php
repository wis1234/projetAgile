<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    protected const PER_PAGE = 20;

    /**
     * Liste paginée des discussions (une par tâche accessible à l'utilisateur),
     * triée par dernier message reçu. Tout le tri/filtrage se fait en SQL :
     * aucune tâche n'est jamais chargée en mémoire "juste pour être ignorée".
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Sous-requête : date du tout dernier message (racine ou réponse) de chaque tâche.
        $lastMessageAt = TaskComment::selectRaw('MAX(created_at)')
            ->whereColumn('task_id', 'tasks.id');

        $query = Task::query()
            ->select(['id', 'title', 'project_id', 'assigned_to'])
            ->addSelect(['last_message_at' => $lastMessageAt])
            ->with(['project:id,name', 'latestComment.user:id,name'])
            ->when(!($user->is_admin ?? false), function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->where('assigned_to', $user->id)
                       ->orWhereHas('project.users', fn ($q3) => $q3->where('users.id', $user->id));
                });
            })
            ->when($request->filled('project_id'), function ($q) use ($request) {
                $q->where('project_id', $request->integer('project_id'));
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim((string) $request->string('search'));
                $q->where(function ($q2) use ($search) {
                    $q2->where('title', 'like', "%{$search}%")
                       ->orWhereHas('project', fn ($q3) => $q3->where('name', 'like', "%{$search}%"));
                });
            })
            // On ne montre que les tâches qui ont au moins un message.
            ->havingRaw('last_message_at is not null')
            ->orderByDesc('last_message_at');

        $paginated = $query->paginate(self::PER_PAGE)->withQueryString();

        $data = $paginated->getCollection()->map(function (Task $task) use ($user) {
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
        })->values();

        return response()->json([
            'data'         => $data,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
        ]);
    }

    /**
     * Liste légère des projets sur lesquels l'utilisateur a au moins une discussion,
     * pour peupler le filtre "Projet" de l'écran Discussions sans dépendre de la page courante.
     */
    public function projects(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::query()
            ->select(['id', 'name'])
            ->when(!($user->is_admin ?? false), function ($q) use ($user) {
                $q->whereHas('users', fn ($q2) => $q2->where('users.id', $user->id));
            })
            ->whereHas('tasks.comments')
            ->orderBy('name')
            ->get();

        return response()->json($projects);
    }
}