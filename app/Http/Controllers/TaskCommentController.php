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

        // Envoyer la notification de commentaire
        $task = \App\Models\Task::with(['project.users', 'assignedUsers'])->findOrFail($taskId);
        
        // Récupérer les utilisateurs à notifier
        $usersToNotify = collect();
        
        // Ajouter les membres du projet
        if ($task->project && $task->project->users) {
            $usersToNotify = $usersToNotify->merge($task->project->users);
        }
        
        // Ajouter l'utilisateur assigné à la tâche s'il existe
        if ($task->assignedUsers && $task->assignedUsers->id) {
            $usersToNotify->push($task->assignedUsers);
        }
        
        // Ajouter l'auteur de la tâche s'il existe et est différent de l'utilisateur assigné
        if ($task->creator && !$usersToNotify->contains('id', $task->creator->id)) {
            $usersToNotify->push($task->creator);
        }
        
        // Éviter les doublons et ne pas notifier l'auteur du commentaire
        $usersToNotify = $usersToNotify->unique('id')
            ->filter(function ($user) use ($comment) {
                return $user && $user->id !== $comment->user_id;
            });
        
        // Envoyer la notification à chaque utilisateur concerné
        foreach ($usersToNotify as $user) {
            $user->notify(new \App\Notifications\TaskCommentNotification($task, $comment));
        }
        
        // Retourner la réponse avec le commentaire créé
        return response()->json([
            'message' => $request->filled('parent_id') ? 'Réponse ajoutée avec succès' : 'Commentaire ajouté avec succès',
            'comment' => $comment->load('user')
        ], 201);
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