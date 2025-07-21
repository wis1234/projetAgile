<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Spatie\Permission\Models\Role;

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
        $query = User::query();
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
            });
        }
        $users = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        $roles = Role::orderBy('name')->get();
        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only('search'),
            'auth' => Auth::user(),
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
        return Inertia::render('Users/Show', [
            'user' => $user,
            'auth' => Auth::user(),
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
        return Inertia::render('Users/Edit', [
            'user' => $user,
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
            'role' => 'required|in:admin,manager,member,user',
        ]);
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