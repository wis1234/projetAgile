<?php
namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCommentController extends Controller
{
    // Liste les commentaires d'une tâche
    public function index($taskId)
    {
        $comments = TaskComment::with('user')
            ->where('task_id', $taskId)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($comments);
    }

    // Ajoute un commentaire à une tâche
    public function store(Request $request, $taskId)
    {
        $request->validate([
            'content' => 'nullable|string|max:2000',
            'audio' => 'nullable|file|mimes:mp3,wav,ogg,webm|max:10240', // Max 10MB
        ]);

        if (!$request->filled('content') && !$request->hasFile('audio')) {
            return response()->json(['message' => 'Le contenu ou un fichier audio est requis.'], 422);
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store('task_comments/audio', 'public');
        }

        $comment = TaskComment::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            'content' => $request->content,
            'audio_path' => $audioPath,
        ]);
        $comment->load('user');

        // Send email notification to project members except the comment author
        $task = \App\Models\Task::with('project.users')->findOrFail($taskId);
        $projectUsers = $task->project->users ?? collect();
        $commentAuthorId = Auth::id();
        $subject = 'Nouveau commentaire sur une tâche';
        $message = "Un nouveau commentaire a été ajouté à la tâche '{$task->title}' par {$comment->user->name} :\n\n";
        if ($comment->content) {
            $message .= "\"{$comment->content}\"";
        }
        if ($comment->audio_path) {
            $message .= " (Contient un message vocal)";
        }
        $actionUrl = route('tasks.show', $task->id);
        $actionText = 'Voir le commentaire';

        foreach ($projectUsers as $user) {
            if ($user->id !== $commentAuthorId) {
                $user->notify(new \App\Notifications\UserActionMailNotification(
                    $subject,
                    $message,
                    $actionUrl,
                    $actionText,
                    [
                        'task_id' => $task->id,
                        'comment_id' => $comment->id,
                    ]
                ));
            }
        }

        return response()->json($comment, 201);
    }

    // Supprime un commentaire
    public function destroy($taskId, $commentId)
    {
        $comment = TaskComment::findOrFail($commentId);
        if ($comment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $comment->delete();
        return response()->json(['success' => true]);
    }

    // Met à jour un commentaire
    public function update(Request $request, $taskId, $commentId)
    {
        $comment = TaskComment::findOrFail($commentId);
        if ($comment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);
        $comment->content = $request->content;
        $comment->save();
        $comment->load('user');
        return response()->json($comment);
    }
} 