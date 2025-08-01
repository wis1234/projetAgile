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
        
        // Ajouter l'URL de la photo de profil à l'utilisateur connecté
        $authUser = [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
        ];
        
        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only('search'),
            'auth' => [
                'user' => $authUser
            ],
            'roles' => $roles,
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
        if (!$current || $current->email !== 'ronaldoagbohou@gmail.com') {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'role' => 'required|in:admin,manager,member,user',
        ]);
        $user->syncRoles([$validated['role']]);
        $user->role = $validated['role'];
        $user->save();
        return back()->with('success', 'Rôle mis à jour !');
    }

    public function createRole(Request $request)
    {
        $current = $request->user();
        if (!$current || $current->email !== 'ronaldoagbohou@gmail.com') {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'role' => 'required|string|min:2|max:50|regex:/^[a-zA-Z0-9_\-]+$/',
        ]);
        $role = Role::firstOrCreate(['name' => $validated['role']]);
        return response()->json(['success' => true, 'role' => $role->name]);
    }

    /**
     * Supprime un rôle Spatie (sauf admin/user)
     */
    public function destroyRole(Request $request, $id)
    {
        $current = $request->user();
        if (!$current || $current->email !== 'ronaldoagbohou@gmail.com') {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $role = Role::findOrFail($id);
        if (in_array($role->name, ['admin', 'user'])) {
            return response()->json(['error' => 'Impossible de supprimer ce rôle système.'], 403);
        }
        // Vérifie si des utilisateurs ont ce rôle
        if ($role->users()->count() > 0) {
            return response()->json(['error' => 'Ce rôle est encore attribué à des utilisateurs.'], 409);
        }
        $role->delete();
        return response()->json(['success' => true]);
    }
}