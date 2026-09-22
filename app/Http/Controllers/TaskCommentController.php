<?php
namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\Sticker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
            'sticker_id' => 'nullable|integer',
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
        $level = 0;

        if ($request->filled('parent_id')) {
            TaskComment::where('task_id', $taskId)->findOrFail($request->parent_id);
            $level = 1;
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store('task_comments/audio', 'public');
        }

        // ── Médias : image / vidéo / sticker ─────────────────────────────
        // Jusqu'ici seuls audio_path et image_path existaient. On gère maintenant aussi
        // video_path (vidéos courtes façon "sticker dansant") et is_sticker (rendu spécial côté front).
        $imagePath = null;
        $videoPath = null;
        $isSticker = false;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('task_comments/images', 'public');
        } elseif ($request->filled('sticker_id')) {
            $sticker = Sticker::find($request->sticker_id);

            if (!$sticker) {
                return response()->json(['message' => 'Ce sticker n\'existe plus.'], 422);
            }

            $isSticker = true;
            if ($sticker->type === 'video') {
                $videoPath = $sticker->image_path;
            } else {
                $imagePath = $sticker->image_path;
            }
        }

        $comment = TaskComment::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            // La colonne 'content' est NOT NULL en base : un sticker n'envoie pas de texte,
            // donc $request->content est null dans ce cas → on force une chaîne vide.
            'content' => $request->content ?? '',
            'audio_path' => $audioPath,
            'image_path' => $imagePath,
            'video_path' => $videoPath,
            'is_sticker' => $isSticker,
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
        // Le commentaire est déjà enregistré en base à ce stade : si la diffusion échoue
        // (Pusher mal configuré, timeout réseau...), on logue l'erreur SANS faire échouer
        // toute la requête, pour que l'utilisateur ne voie pas un "échec" pour un message
        // en réalité bien envoyé.
        try {
            event(new TaskCommentPosted($comment, (int) $taskId));
        } catch (\Throwable $e) {
            Log::error('Erreur diffusion temps réel (comment.posted)', [
                'comment_id' => $comment->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Envoyer la notification de commentaire — également isolé pour ne jamais faire
        // échouer l'enregistrement du commentaire lui-même.
        try {
            $task = \App\Models\Task::with(['project.users', 'assignedUsers'])->findOrFail($taskId);

            $usersToNotify = collect();

            if ($task->project && $task->project->users) {
                $usersToNotify = $usersToNotify->merge($task->project->users);
            }

            if ($task->assignedUsers && $task->assignedUsers->id) {
                $usersToNotify->push($task->assignedUsers);
            }

            if ($task->creator && !$usersToNotify->contains('id', $task->creator->id)) {
                $usersToNotify->push($task->creator);
            }

            $usersToNotify = $usersToNotify->unique('id')
                ->filter(function ($user) use ($comment) {
                    return $user && $user->id !== $comment->user_id;
                });

            $author = auth()->user();

            foreach ($usersToNotify as $user) {
                $user->notify(
                    new ProjaNotification(
                        'Nouveau commentaire',
                        $author->name.' a commenté la tâche "'.$task->title.'"',
                        '/tasks/'.$task->id,
                        null,
                        'task_comment'
                    )
                );

                if ($author->share_discussions_by_email) {
                    $user->notify(
                        new TaskCommentNotification(
                            $task,
                            $comment
                        )
                    );
                }
            }

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
        } catch (\Throwable $e) {
            Log::error('Erreur notifications commentaire', [
                'comment_id' => $comment->id,
                'error' => $e->getMessage(),
            ]);
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