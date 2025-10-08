<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', User::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $currentUser = Auth::user();
        $query = User::query();
        if (!$currentUser->hasRole('admin')) {
            $projectIds = $currentUser->projects()->pluck('projects.id');
            $userIds = DB::table('project_user')
                ->whereIn('project_id', $projectIds)
                ->pluck('user_id');
            $query->whereIn('id', $userIds);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
            });
        }
        $users = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        $roles = Role::orderBy('name')->get();
        
        // Préparer les statistiques (uniquement pour les admins)
        $stats = null;
        if ($currentUser->hasRole('admin')) {
            $stats = [
                'total_users' => User::count(),
                'admins_count' => User::role('admin')->count(),
                'managers_count' => User::role('manager')->count(),
                'members_count' => User::role('member')->count()
            ];
        }
        
        // Ajouter l'URL de la photo de profil à l'utilisateur connecté
        $authUser = [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
            'role' => $currentUser->roles->first()?->name ?? 'user',
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
            'roles' => $roles,
            'auth' => $authUser,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $this->authorize('create', User::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        return Inertia::render('Users/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $this->authorize('create', User::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,manager,member,user',
        ]);
        $user = User::create($validated);
        $user->assignRole($validated['role']); // Assignation du rôle spatie
        activity_log('create', 'Création utilisateur', $user);
        return redirect()->route('users.index')->with('success', 'Utilisateur créé avec succès');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::with('projects')->findOrFail($id);
        try {
            $this->authorize('view', $user);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        $currentUser = Auth::user();
        $authUser = [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
        ];
        
        return Inertia::render('Users/Show', [
            'user' => $user,
            'auth' => [
                'user' => $authUser
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = User::findOrFail($id);
        try {
            $this->authorize('update', $user);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        $currentUser = Auth::user();
        $authUser = [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
        ];
        
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'auth' => [
                'user' => $authUser
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        try {
            $this->authorize('update', $user);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$id,
            'role' => 'required|in:admin,manager,member,user,developer',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($user->profile_photo_path) {
                \Storage::disk('public')->delete($user->profile_photo_path);
            }
            
            $profilePhotoPath = $request->file('profile_photo')->store('profile-photos', 'public');
            $validated['profile_photo_path'] = $profilePhotoPath;
        }
        
        // Remove the file from the data array
        unset($validated['profile_photo']);
        
        $user->update($validated);
        if ($user->hasRole($validated['role']) === false) {
            $user->syncRoles([$validated['role']]); // Met à jour le rôle spatie
        }
        
        activity_log('update', 'Modification utilisateur', $user);
        
        return redirect()->route('users.index')->with('success', 'Utilisateur mis à jour avec succès');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        try {
            $this->authorize('delete', $user);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $user->delete();
        activity_log('delete', 'Suppression utilisateur', $user);
        return redirect()->route('users.index')->with('success', 'Utilisateur supprimé avec succès');
    }

    /**
     * API: Get user details as JSON (for dynamic panel)
     */
    public function apiShow($id)
    {
        $user = User::with('projects')->findOrFail($id);
        return response()->json($user);
    }

    public function assignRole(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $current = $request->user();
        
        // Vérifier les autorisations
        if (!$current || $current->email !== 'ronaldoagbohou@gmail.com') {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Valider la requête
        $validated = $request->validate([
            'role' => 'required|in:admin,manager,member,user,developer',
            'send_email' => 'sometimes|boolean'
        ]);

        // Vérifier si le rôle a réellement changé
        $oldRole = $user->roles->first() ? $user->roles->first()->name : 'user';
        
        if ($oldRole === $validated['role']) {
            return response()->json(['message' => 'Le rôle est déjà défini à cette valeur'], 200);
        }

        // Mettre à jour le rôle
        $user->syncRoles([$validated['role']]);
        $user->role = $validated['role'];
        $user->save();

        // Envoyer l'email de notification si demandé
        $sendEmail = $request->input('send_email', true);
        if ($sendEmail) {
            try {
                $user->notify(new \App\Notifications\RoleChangedNotification(
                    $validated['role'],
                    $oldRole,
                    $current
                ));
            } catch (\Exception $e) {
                // Logger l'erreur mais ne pas échouer la requête
                \Log::error('Erreur lors de l\'envoi de l\'email de notification: ' . $e->getMessage());
            }
        }

        // Journaliser l'action
        activity_log('update', 'Changement de rôle', $user, [
            'old_role' => $oldRole,
            'new_role' => $validated['role'],
            'changed_by' => $current->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rôle mis à jour avec succès',
            'role' => $validated['role'],
            'role_display' => ucfirst($validated['role'])
        ]);
    }

    public function createRole(Request $request)
    {
        $validated = $request->validate([
            'role' => 'required|string|unique:roles,name'
        ]);

        try {
            $role = Role::create(['name' => $validated['role']]);
            return response()->json(['success' => true, 'message' => 'Rôle créé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de la création du rôle: ' . $e->getMessage()], 500);
        }
    }
    /**
     * Supprime un rôle
     */
    public function deleteRole(Role $role)
    {
        try {
            // Empêcher la suppression des rôles système importants
            if (in_array($role->name, ['admin', 'user'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce rôle ne peut pas être supprimé car il est nécessaire au bon fonctionnement du système.'
                ], 403);
            }

            // Vérifier si des utilisateurs ont encore ce rôle
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce rôle car des utilisateurs l\'utilisent encore.'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du rôle.'
            ], 500);
        }
    }
}