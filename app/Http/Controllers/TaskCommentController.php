<?php
namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\Sticker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\ProjaNotification;
use App\Events\TaskCommentPosted;
use App\Events\TaskCommentDeleted;
use App\Events\TaskCommentUpdated;
use App\Notifications\TaskCommentNotification;

class TaskCommentController extends Controller
{
    // Liste les commentaires d'une tâche, à plat (façon WhatsApp), avec le message cité (parent) et les réactions
    public function index($taskId)
    {
        $comments = TaskComment::with(['user', 'reactions', 'mentions', 'parent.user'])
            ->where('task_id', $taskId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                $comment->reactions_summary = $comment->reactions
                    ->groupBy('emoji')
                    ->map(fn($group) => [
                        'count'    => $group->count(),
                        'user_ids' => $group->pluck('user_id')->toArray(),
                    ])
                    ->toArray();
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
            'image' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:8192', // Max 8MB
            'sticker_id' => 'nullable|exists:stickers,id',
            'parent_id' => 'nullable|exists:task_comments,id',
            'mentioned_user_ids' => 'nullable|array',
            'mentioned_user_ids.*' => 'exists:users,id',
        ]);

        if (
            !$request->filled('content')
            && !$request->hasFile('audio')
            && !$request->hasFile('image')
            && !$request->filled('sticker_id')
        ) {
            return response()->json(['message' => 'Le contenu, un fichier audio, une image ou un sticker est requis.'], 422);
        }

        // Vérifier si c'est une réponse à un commentaire
        // Style WhatsApp : on peut répondre à N'IMPORTE QUEL message, y compris une réponse.
        // On cite toujours directement le message ciblé (pas de vrai arbre de niveaux) :
        // "level" ne sert qu'à savoir si c'est une réponse (1) ou un message racine (0).
        $parentComment = null;
        $level = 0;

        if ($request->filled('parent_id')) {
            $parentComment = TaskComment::where('task_id', $taskId)->findOrFail($request->parent_id);
            $level = 1;
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store('task_comments/audio', 'public');
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('task_comments/images', 'public');
        } elseif ($request->filled('sticker_id')) {
            // Un sticker est une image déjà stockée : on réutilise simplement son chemin,
            // pas besoin de re-uploader un fichier.
            $sticker = Sticker::find($request->sticker_id);
            $imagePath = $sticker?->image_path;
        }

        $comment = TaskComment::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            'content' => $request->content,
            'audio_path' => $audioPath,
            'image_path' => $imagePath,
            'parent_id' => $request->parent_id,
            'level' => $level,
        ]);


        // Enregistrer les mentions et notifier les utilisateurs taggés
        $mentionedIds = collect($request->input('mentioned_user_ids', []))
            ->unique()
            ->reject(fn($id) => (int) $id === (int) Auth::id());

        if ($mentionedIds->isNotEmpty()) {
            $comment->mentions()->sync($mentionedIds);
        }

        // Charger les relations nécessaires pour la réponse
        $comment->load('user', 'parent.user', 'mentions');

        // ── Diffusion temps réel (WebSocket via Pusher) ──────────────────
        event(new TaskCommentPosted($comment, (int) $taskId));

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



        $author = auth()->user();




        // Envoyer la notification à chaque utilisateur concerné
        foreach ($usersToNotify as $user) {

            // Notification interne
            $user->notify(
                new ProjaNotification(
                    'Nouveau commentaire',
                    $author->name.' a commenté la tâche "'.$task->title.'"',
                    '/tasks/'.$task->id,
                    null,
                    'task_comment'
                )
            );

            // Email uniquement si l'auteur l'autorise
            if ($author->share_discussions_by_email) {

                $user->notify(
                    new TaskCommentNotification(
                        $task,
                        $comment
                    )
                );

            }

        }

        // Notification dédiée pour les utilisateurs explicitement mentionnés (@)
        if ($mentionedIds->isNotEmpty()) {
            $mentionedUsers = \App\Models\User::whereIn('id', $mentionedIds)->get();
            foreach ($mentionedUsers as $mentionedUser) {
                $mentionedUser->notify(
                    new ProjaNotification(
                        'Vous avez été mentionné',
                        $author->name.' vous a mentionné dans un commentaire sur la tâche "'.$task->title.'"',
                        '/tasks/'.$task->id,
                        null,
                        'task_comment_mention'
                    )
                );
            }
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

        // ── Diffusion temps réel (WebSocket via Pusher) ──────────────────
        event(new TaskCommentDeleted((int) $commentId, (int) $taskId));

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

        // ── Diffusion temps réel (WebSocket via Pusher) ──────────────────
        event(new TaskCommentUpdated($comment, (int) $taskId));

        return response()->json($comment);
    }
}