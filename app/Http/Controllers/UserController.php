<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Task;
use App\Models\File;

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
        $query = User::query()->with('roles');
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
        if ($request->filled('role')) {
            $r = $request->role;
            $query->where(function ($q) use ($r) {
                $q->where('role', $r)->orWhereHas('roles', fn ($rq) => $rq->where('name', $r));
            });
        }
        $users = $query
            ->select(['id', 'name', 'email', 'role', 'job_title', 'company', 'profile_photo_path', 'created_at', 'email_verified_at'])
            ->withCount('projects')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();
        $users->getCollection()->transform(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->roles->first()?->name ?? $u->role ?? 'user',
            'job_title' => $u->job_title,
            'company' => $u->company,
            'profile_photo_path' => $u->profile_photo_path,
            'profile_photo_url' => $u->profile_photo_url,
            'projects_count' => $u->projects_count,
            'verified' => (bool) $u->email_verified_at,
            'created_at' => $u->created_at,
        ]);
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
            'can_assign_role' => $this->canAssignRoles($currentUser),
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
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
            'role' => 'required|in:admin,manager,member,user,candidate',
        ]);
        $user = User::create($validated);
        // « candidate » n'est qu'une valeur du champ users.role (pas un rôle Spatie).
        if ($validated['role'] !== User::ROLE_CANDIDATE) {
            $user->assignRole($validated['role']); // Assignation du rôle spatie
        }
        activity_log('create', 'Création utilisateur', $user);
        return redirect()->route('users.index')->with('success', 'Utilisateur créé avec succès');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::with('roles')->findOrFail($id);
        try {
            $this->authorize('view', $user);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $currentUser = Auth::user();

        return Inertia::render('Users/Show', [
            'user' => $this->presentUser($user, $currentUser),
            'auth' => [
                'user' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'email' => $currentUser->email,
                    'profile_photo_url' => $currentUser->profile_photo_url ?? null,
                    'role' => $currentUser->roles->first()?->name ?? $currentUser->role ?? 'user',
                ],
            ],
        ]);
    }

    /** Seul ce compte peut attribuer des rôles (règle historique, centralisée ici). */
    private function canAssignRoles(?User $u): bool
    {
        return $u && $u->email === 'ronaldoagbohou@gmail.com';
    }

    /**
     * Fiche utilisateur « filtrée » selon le visiteur : on n'expose JAMAIS le modèle brut
     * (IBAN, facturation, etc.). Niveaux : public → co-membre → soi-même / admin.
     */
    private function presentUser(User $user, User $viewer): array
    {
        $isSelf = $viewer->id === $user->id;
        $isAdmin = $viewer->hasRole('admin') || $viewer->role === 'admin';
        $canSeePrivate = $isSelf || $isAdmin;

        // Projets visibles : tous pour soi/admin, sinon uniquement ceux partagés avec le visiteur
        $viewerProjectIds = $viewer->projects()->pluck('projects.id');
        $projects = $user->projects()->withPivot('role')->get();
        if (!$canSeePrivate) {
            $projects = $projects->whereIn('id', $viewerProjectIds)->values();
        }
        $projectIds = $projects->pluck('id');
        $shared = $viewerProjectIds->intersect($user->projects()->pluck('projects.id'))->isNotEmpty();
        $canSeeContact = $canSeePrivate || $shared || $viewer->hasRole('manager');

        // Tâches assignées à la personne dans les projets visibles
        $byStatus = Task::where('assigned_to', $user->id)->whereIn('project_id', $projectIds)
            ->select('status', DB::raw('count(*) as c'))->groupBy('status')->pluck('c', 'status');
        $overdue = Task::where('assigned_to', $user->id)->whereIn('project_id', $projectIds)
            ->where('status', '!=', 'done')->whereNotNull('due_date')->where('due_date', '<', now())->count();
        $perProject = Task::where('assigned_to', $user->id)->whereIn('project_id', $projectIds)
            ->select('project_id', DB::raw('count(*) as total'), DB::raw("sum(case when status = 'done' then 1 else 0 end) as done"))
            ->groupBy('project_id')->get()->keyBy('project_id');
        $recentTasks = Task::with('project:id,name')->where('assigned_to', $user->id)->whereIn('project_id', $projectIds)
            ->latest('updated_at')->take(6)->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id'])
            ->map(fn ($t) => [
                'id' => $t->id, 'title' => $t->title, 'status' => $t->status, 'priority' => $t->priority,
                'due_date' => $t->due_date, 'project' => $t->project?->only(['id', 'name']),
            ]);
        $filesCount = File::where('user_id', $user->id)->whereIn('project_id', $projectIds)->count();

        $roleName = $user->roles->first()?->name ?? $user->role ?? 'user';

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $roleName,
            'job_title' => $user->job_title,
            'company' => $user->company,
            'bio' => $user->bio,
            'profile_photo_url' => $user->profile_photo_url,
            'created_at' => $user->created_at,
            'email' => $canSeeContact ? $user->email : null,
            'phone' => $canSeeContact ? $user->phone : null,
            'projects' => $projects->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'role' => $p->pivot->role,
                'joined_at' => $p->pivot->created_at,
                'tasks_total' => (int) ($perProject[$p->id]->total ?? 0),
                'tasks_done' => (int) ($perProject[$p->id]->done ?? 0),
                'shared' => $viewerProjectIds->contains($p->id),
            ])->values(),
            'stats' => [
                'projects' => $projects->count(),
                'tasks_total' => (int) $byStatus->sum(),
                'tasks_by_status' => $byStatus,
                'tasks_overdue' => $overdue,
                'files' => $filesCount,
            ],
            'recent_tasks' => $recentTasks,
            'permissions' => [
                'is_self' => $isSelf,
                'can_edit' => $isSelf || $isAdmin,
                'edit_url' => $isSelf ? route('profile.edit') : ($isAdmin ? route('users.edit', $user->id) : null),
                'can_delete' => $isAdmin && !$isSelf,
                'can_assign_role' => $this->canAssignRoles($viewer),
                'sees_private' => $canSeePrivate,
            ],
        ];

        if ($canSeePrivate) {
            $lastSeen = null;
            try {
                $ts = DB::table('sessions')->where('user_id', $user->id)->max('last_activity');
                $lastSeen = $ts ? \Carbon\Carbon::createFromTimestamp($ts)->toIso8601String() : null;
            } catch (\Throwable $e) {
                // driver de session ≠ database : pas d'information
            }
            $recentActivity = [];
            try {
                $recentActivity = DB::table('activities')->where('user_id', $user->id)->latest('created_at')->take(8)
                    ->get(['id', 'type', 'description', 'created_at']);
            } catch (\Throwable $e) {
            }
            $data += [
                'email_verified_at' => $user->email_verified_at,
                'last_seen_at' => $lastSeen,
                'recent_activity' => $recentActivity,
                'subscription' => [
                    'active' => (bool) $user->has_active_subscription,
                    'plan' => $user->subscription_plan_name,
                    'ends_at' => $user->subscription_ends_at_formatted,
                    'days_remaining' => $user->subscription_days_remaining,
                ],
                'bank' => $user->iban ? [
                    'bank_name' => $user->bank_name,
                    'account_holder_name' => $user->account_holder_name,
                    'iban_masked' => str_repeat('•', max(strlen($user->iban) - 4, 0)) . substr($user->iban, -4),
                ] : null,
            ];
        }

        return $data;
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
        
        $actor = Auth::user();
        $actorIsAdmin = $actor->hasRole('admin') || $actor->role === 'admin';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$id,
            // Le rôle n'est modifiable que par un administrateur (évite qu'un manager s'auto-promeuve)
            'role' => ($actorIsAdmin ? 'required' : 'sometimes').'|in:admin,manager,member,user,developer,candidate',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        if (!$actorIsAdmin) {
            unset($validated['role']);
        }

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete(preg_replace('#^public/#', '', $user->profile_photo_path));
            }

            // Même format que ProfileController (préfixe « public/ ») pour un affichage cohérent
            $validated['profile_photo_path'] = 'public/'.$request->file('profile_photo')->store('profile-photos', 'public');
        }
        
        // Remove the file from the data array
        unset($validated['profile_photo']);
        
        $user->update($validated);
        if (!isset($validated['role'])) {
            // rôle inchangé (auteur non administrateur)
        } elseif ($validated['role'] === User::ROLE_CANDIDATE) {
            $user->syncRoles([]); // un candidat n'a aucun rôle Spatie
        } elseif ($user->hasRole($validated['role']) === false) {
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
        if ((int) $user->id === (int) Auth::id()) {
            return redirect()->back()->with('error', 'Vous ne pouvez pas supprimer votre propre compte ici.');
        }
        activity_log('delete', 'Suppression utilisateur', $user);
        $user->delete();
        return redirect()->route('users.index')->with('success', 'Utilisateur supprimé avec succès');
    }

    /**
     * API: Get user details as JSON (for dynamic panel)
     */
    public function apiShow($id)
    {
        $user = User::with('roles')->findOrFail($id);
        $this->authorize('view', $user);
        return response()->json($this->presentUser($user, Auth::user()));
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
            'role' => 'required|in:admin,manager,member,user,developer,candidate',
            'send_email' => 'sometimes|boolean'
        ]);

        // Vérifier si le rôle a réellement changé
        $oldRole = $user->roles->first() ? $user->roles->first()->name : 'user';
        
        if ($oldRole === $validated['role']) {
            return response()->json(['message' => 'Le rôle est déjà défini à cette valeur'], 200);
        }

        // Mettre à jour le rôle
        $user->syncRoles($validated['role'] === User::ROLE_CANDIDATE ? [] : [$validated['role']]);
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
        activity_log(
            'update',
            "Rôle de {$user->name} modifié : {$oldRole} → {$validated['role']} (par {$current->name})",
            $user
        );

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

 //message preference in task discussions
    public function toggleDiscussionEmailSharing()
    {
        $user = auth()->user();

        $user->share_discussions_by_email =
            ! $user->share_discussions_by_email;

        $user->save();

        return response()->json([
            'success' => true,
            'enabled' => $user->share_discussions_by_email
        ]);
    }
}