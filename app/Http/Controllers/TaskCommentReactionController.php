<?php
namespace App\Http\Controllers;

use App\Models\TaskComment;
use App\Models\TaskCommentReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCommentReactionController extends Controller
{
    /**
     * Toggle une réaction sur un commentaire.
     *
     * Règle :
     *  - Même emoji déjà posé  → on le retire   (toggle off)
     *  - Emoji différent déjà posé → on le change (update)
     *  - Aucune réaction existante → on crée     (toggle on)
     *
     * Retourne le résumé groupé des réactions du commentaire.
     */
    public function toggle(Request $request, $taskId, $commentId)
    {
        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        // Vérifie que le commentaire appartient bien à la tâche
        $comment = TaskComment::where('task_id', $taskId)->findOrFail($commentId);

        $userId = Auth::id();
        $emoji  = $request->input('emoji');

        $existing = TaskCommentReaction::where('task_comment_id', $commentId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                $existing->delete();
                $action = 'removed';
            } else {
                $existing->update(['emoji' => $emoji]);
                $action = 'updated';
            }
        } else {
            TaskCommentReaction::create([
                'task_comment_id' => $commentId,
                'user_id'         => $userId,
                'emoji'           => $emoji,
            ]);
            $action = 'added';
        }

        return response()->json([
            'action'    => $action,
            'reactions' => $this->getReactionsSummary($commentId),
        ]);
    }

    /**
     * Retourne le résumé des réactions pour un commentaire.
     */
    public function index($taskId, $commentId)
    {
        TaskComment::where('task_id', $taskId)->findOrFail($commentId);

        return response()->json([
            'reactions' => $this->getReactionsSummary($commentId),
        ]);
    }

    /**
     * Construit le résumé groupé par emoji :
     * { "👍": { count: 2, user_ids: [1, 3] }, ... }
     */
    private function getReactionsSummary(int $commentId): array
    {
        return TaskCommentReaction::where('task_comment_id', $commentId)
            ->get()
            ->groupBy('emoji')
            ->map(fn($group) => [
                'count'    => $group->count(),
                'user_ids' => $group->pluck('user_id')->toArray(),
            ])
            ->toArray();
    }
}
