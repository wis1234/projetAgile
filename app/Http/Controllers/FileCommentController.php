<?php
namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FileCommentController extends Controller
{
    // Liste les commentaires d'un fichier
    public function index($fileId)
    {
        $comments = FileComment::with('user')
            ->where('file_id', $fileId)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($comments);
    }

    // Ajoute un commentaire à un fichier
    public function store(Request $request, $fileId)
    {
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);
        $comment = FileComment::create([
            'file_id' => $fileId,
            'user_id' => Auth::id(),
            'content' => $request->content,
        ]);
        $comment->load('user');

        // Send email notification to project members except the comment author
        $file = File::with('project.users')->findOrFail($fileId);
        $projectUsers = $file->project->users ?? collect();
        $commentAuthorId = Auth::id();
        $subject = 'Nouveau commentaire sur un fichier';
        $message = "Un nouveau commentaire a été ajouté au fichier '{$file->name}' par {$comment->user->name} :\n\n\"{$comment->content}\"";
        $actionUrl = route('files.show', $file->id);
        $actionText = 'Voir le commentaire';

        foreach ($projectUsers as $user) {
            if ($user->id !== $commentAuthorId) {
                $user->notify(new \App\Notifications\UserActionMailNotification(
                    $subject,
                    $message,
                    $actionUrl,
                    $actionText,
                    [
                        'file_id' => $file->id,
                        'comment_id' => $comment->id,
                    ]
                ));
            }
        }

        return response()->json($comment, 201);
    }

    // Supprime un commentaire
    public function destroy($fileId, $commentId)
    {
        $comment = FileComment::findOrFail($commentId);
        if ($comment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $comment->delete();
        return response()->json(['success' => true]);
    }

    // Met à jour un commentaire
    public function update(Request $request, $fileId, $commentId)
    {
        $comment = FileComment::findOrFail($commentId);
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