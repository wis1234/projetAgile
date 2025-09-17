<?php
namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCommentController extends Controller
{
    // Liste les commentaires d'une tâche avec leurs réponses
    public function index($taskId)
    {
        $comments = TaskComment::with(['user', 'replies.user'])
            ->where('task_id', $taskId)
            ->whereNull('parent_id') // Ne récupérer que les commentaires de premier niveau
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($comment) {
                // Charger les réponses imbriquées de manière récursive
                $comment->load(['replies' => function($query) {
                    $query->with(['user', 'replies' => function($q) {
                        $q->with('user');
                    }]);
                }]);
                return $comment;
            });
            
        return response()->json($comments);
    }

    // Ajoute un commentaire ou une réponse à une tâche
    public function store(Request $request, $taskId)
    {
        $request->validate([
            'content' => 'nullable|string|max:2000',
            'audio' => 'nullable|file|mimes:mp3,wav,ogg,webm|max:10240', // Max 10MB
            'parent_id' => 'nullable|exists:task_comments,id',
        ]);

        if (!$request->filled('content') && !$request->hasFile('audio')) {
            return response()->json(['message' => 'Le contenu ou un fichier audio est requis.'], 422);
        }
        
        // Vérifier si c'est une réponse à un commentaire
        $parentComment = null;
        $level = 0;
        
        if ($request->filled('parent_id')) {
            $parentComment = TaskComment::findOrFail($request->parent_id);
            // Limiter le niveau d'imbrication à 2 niveaux
            $level = $parentComment->level + 1;
            if ($level > 1) {
                return response()->json(['message' => 'Vous ne pouvez pas répondre à une réponse.'], 422);
            }
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
            'parent_id' => $request->parent_id,
            'level' => $level,
        ]);
        
        // Charger les relations nécessaires pour la réponse
        $comment->load('user', 'parent.user');

        // Send email notification to project members and mentioned users
        $task = \App\Models\Task::with('project.users')->findOrFail($taskId);
        $projectUsers = $task->project->users ?? collect();
        $commentAuthorId = Auth::id();
        
        // Déterminer le type de notification en fonction du contexte
        $isReply = $comment->parent_id !== null;
        $subject = $isReply ? 'Nouvelle réponse à un commentaire' : 'Nouveau commentaire sur une tâche';
        
        // Construire le message en fonction du contexte
        $message = $isReply 
            ? "Une nouvelle réponse a été ajoutée à un commentaire sur la tâche '{$task->title}' par {$comment->user->name} :\n\n"
            : "Un nouveau commentaire a été ajouté à la tâche '{$task->title}' par {$comment->user->name} :\n\n";
            
        if ($comment->content) {
            $message .= "\"{$comment->content}\"\n\n";
        }
        
        if ($isReply && $comment->parent) {
            $message .= "En réponse à :\n";
            $message .= $comment->parent->content ? "\"{$comment->parent->content}\\n\n" : "(Message vocal)\n\n";
            $message .= "— {$comment->parent->user->name}\n\n";
        }
        
        if ($comment->audio_path) {
            $message .= "(Contient un message vocal)\n\n";
        }
        
        $actionUrl = route('tasks.show', $task->id) . '#comment-' . $comment->id;
        $actionText = $isReply ? 'Voir la réponse' : 'Voir le commentaire';
        
        // Liste des utilisateurs à notifier
        $usersToNotify = $projectUsers->filter(function($user) use ($commentAuthorId, $comment) {
            // Ne pas notifier l'auteur du commentaire
            if ($user->id === $commentAuthorId) {
                return false;
            }
            
            // Si c'est une réponse, ne pas notifier la personne qui a posté le commentaire parent
            // sauf si c'est une réponse à son propre commentaire
            if ($comment->parent_id && $comment->parent->user_id === $user->id && $comment->parent->user_id !== $commentAuthorId) {
                return true;
            }
            
            // Pour les commentaires de premier niveau, notifier tous les membres du projet
            return $comment->parent_id === null;
        });

        // Envoyer les notifications aux utilisateurs concernés
        foreach ($usersToNotify as $user) {
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