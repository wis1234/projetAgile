<?php

// ══════════════════════════════════════════════════════════════
//  app/Http/Controllers/FileAccessController.php
// ══════════════════════════════════════════════════════════════
namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileAccess;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class FileAccessController extends Controller
{
    use AuthorizesRequests;

    // GET /files/{file}/access — liste des accès
    public function index(File $file)
    {
        $this->authorize('manageAccess', $file);

        $accesses = $file->accesses()
            ->with('user:id,name,email,profile_photo_path', 'grantedBy:id,name')
            ->get();

        return response()->json([
            'accesses'   => $accesses,
            'owner'      => $file->user?->only('id','name','email','profile_photo_path'),
            'my_access'  => $file->accessFor(auth()->user()),
        ]);
    }

    // POST /files/{file}/access — accorder ou modifier un accès
    public function store(Request $request, File $file)
    {
        $this->authorize('manageAccess', $file);

        $validated = $request->validate([
            'user_id'    => 'required|exists:users,id',
            'permission' => 'required|in:none,view,comment,edit,admin',
            'expires_at' => 'nullable|date|after:now',
        ]);

        // Ne pas modifier le propriétaire
        if ($file->user_id == $validated['user_id']) {
            return response()->json(['message' => 'Impossible de modifier l\'accès du propriétaire'], 422);
        }

        $access = FileAccess::updateOrCreate(
            ['file_id' => $file->id, 'user_id' => $validated['user_id']],
            [
                'permission' => $validated['permission'],
                'expires_at' => $validated['expires_at'] ?? null,
                'granted_by' => auth()->id(),
            ]
        );

        // Notifier l'utilisateur
        $user = User::find($validated['user_id']);
        if ($user && $validated['permission'] !== 'none') {
            $user->notify(new \App\Notifications\UserActionMailNotification(
                'Accès partagé — ' . $file->name,
                auth()->user()->name . " vous a accordé un accès « {$validated['permission']} » sur le fichier « {$file->name} ».",
                route('files.edit-content', $file->id),
                'Ouvrir le document',
                ['file_id' => $file->id, 'permission' => $validated['permission']]
            ));
        }

        return response()->json(['access' => $access->load('user:id,name,email,profile_photo_path')], 201);
    }

    // DELETE /files/{file}/access/{user} — révoquer
    public function destroy(File $file, User $user)
    {
        $this->authorize('manageAccess', $file);

        if ($file->user_id == $user->id) {
            return response()->json(['message' => 'Impossible de révoquer le propriétaire'], 422);
        }

        FileAccess::where('file_id', $file->id)
                  ->where('user_id', $user->id)
                  ->delete();

        return response()->json(['message' => 'Accès révoqué']);
    }
}

