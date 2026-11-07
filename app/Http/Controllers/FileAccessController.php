<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileAccess;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FileAccessController extends Controller
{
    use AuthorizesRequests;

    // GET /files/{file}/access — liste des accès
    public function index(File $file)
    {
        $this->authorize('manageAccess', $file);

        if (empty($file->share_token)) {
            $file->update(['share_token' => Str::random(32)]);
        }

        $accesses = $file->accesses()
            ->with('user:id,name,email,profile_photo_path', 'grantedBy:id,name')
            ->get();

        return response()->json([
            'accesses'          => $accesses,
            'owner'             => $file->user?->only('id','name','email','profile_photo_path'),
            'my_access'         => $file->accessFor(auth()->user()),
            'share_token'       => $file->share_token,
            'share_url'         => $file->getShareUrl(),
            'public_permission' => $file->public_permission ?? 'none',
        ]);
    }

    // POST /files/{file}/access — accorder ou modifier un accès (interne ou externe par email)
    public function store(Request $request, File $file)
    {
        $this->authorize('manageAccess', $file);

        $validated = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'email'      => 'nullable|email',
            'name'       => 'nullable|string|max:255',
            'permission' => 'required|in:none,view,comment,edit,admin',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $user = null;
        if (!empty($validated['user_id'])) {
            $user = User::find($validated['user_id']);
        } elseif (!empty($validated['email'])) {
            $email = strtolower(trim($validated['email']));
            $user = User::where('email', $email)->first();

            // Créer un utilisateur externe s'il n'existe pas encore
            if (!$user) {
                $userName = $validated['name'] ?: explode('@', $email)[0];
                $user = User::create([
                    'name'     => $userName,
                    'email'    => $email,
                    'password' => Hash::make(Str::random(32)),
                    'role'     => 'user',
                ]);
            }
        }

        if (!$user) {
            return response()->json(['message' => 'Veuillez spécifier un utilisateur ou une adresse email valide.'], 422);
        }

        // Ne pas modifier le propriétaire
        if ($file->user_id == $user->id) {
            return response()->json(['message' => 'Impossible de modifier l\'accès du propriétaire'], 422);
        }

        $access = FileAccess::updateOrCreate(
            ['file_id' => $file->id, 'user_id' => $user->id],
            [
                'permission' => $validated['permission'],
                'expires_at' => $validated['expires_at'] ?? null,
                'granted_by' => auth()->id(),
            ]
        );

        // Notifier l'utilisateur
        if ($validated['permission'] !== 'none') {
            try {
                $user->notify(new \App\Notifications\UserActionMailNotification(
                    'Accès partagé — ' . $file->name,
                    auth()->user()->name . " vous a accordé un accès « {$validated['permission']} » sur le fichier « {$file->name} ».",
                    route('files.edit-content', $file->id),
                    'Ouvrir le document',
                    ['file_id' => $file->id, 'permission' => $validated['permission']]
                ));
            } catch (\Throwable $e) {
                \Log::warning('Impossible d\'envoyer la notification de partage par email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'access'    => $access->load('user:id,name,email,profile_photo_path'),
            'share_url' => $file->getShareUrl(),
        ], 201);
    }

    // POST /files/{file}/public-share — activer/désactiver le partage par lien public
    public function updatePublicShare(Request $request, File $file)
    {
        $this->authorize('manageAccess', $file);

        $validated = $request->validate([
            'public_permission' => 'required|in:none,view,comment,edit',
        ]);

        if (empty($file->share_token)) {
            $file->share_token = Str::random(32);
        }

        $file->public_permission = $validated['public_permission'];
        $file->save();

        return response()->json([
            'success'           => true,
            'public_permission' => $file->public_permission,
            'share_token'       => $file->share_token,
            'share_url'         => $file->getShareUrl(),
            'message'           => 'Paramètres de partage public mis à jour.',
        ]);
    }

    // GET /shared-document/{token} — point d'entrée pour un lien de partage externe
    public function accessSharedDocument(Request $request, $token)
    {
        $file = File::where('share_token', $token)->firstOrFail();

        if (empty($file->public_permission) || $file->public_permission === 'none') {
            return \Inertia\Inertia::render('Files/SharedDocumentJoin', [
                'file'  => ['name' => $file->name],
                'error' => 'Le partage public de ce document a été désactivé par son propriétaire.',
            ]);
        }

        // Si l'utilisateur est déjà connecté à ProJA
        if (Auth::check()) {
            $user = Auth::user();
            // Accorder l'accès si non présent
            $existing = $file->accesses()->where('user_id', $user->id)->first();
            if (!$existing && $file->user_id !== $user->id) {
                $file->accesses()->create([
                    'user_id'    => $user->id,
                    'permission' => $file->public_permission,
                    'granted_by' => $file->user_id,
                ]);
            }
            return redirect()->route('files.edit-content', $file->id);
        }

        // Si l'invité a soumis son nom pour rejoindre
        if ($request->isMethod('post') && $request->filled('guest_name')) {
            $request->validate([
                'guest_name' => 'required|string|min:2|max:50',
            ]);

            $guestName = trim($request->input('guest_name'));
            $guestEmail = 'guest_' . Str::random(10) . '@guest.proja.local';

            $guestUser = User::create([
                'name'     => $guestName . ' (Invité)',
                'email'    => $guestEmail,
                'password' => Hash::make(Str::random(32)),
                'role'     => 'user',
            ]);

            $file->accesses()->create([
                'user_id'    => $guestUser->id,
                'permission' => $file->public_permission,
                'granted_by' => $file->user_id,
            ]);

            Auth::login($guestUser);

            return redirect()->route('files.edit-content', $file->id);
        }

        // Afficher l'écran d'accueil invité
        return \Inertia\Inertia::render('Files/SharedDocumentJoin', [
            'file' => [
                'id'                => $file->id,
                'name'              => $file->name,
                'type'              => $file->type,
                'public_permission' => $file->public_permission,
                'owner_name'        => $file->user?->name ?? 'Un collaborateur',
                'share_token'       => $file->share_token,
            ],
            'public_permission' => $file->public_permission,
        ]);
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
