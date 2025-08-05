<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ActivitiesExport;
use App\Models\Activity;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ActivityController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Activity::with('user');
        
        // Pour les non-admins, filtrer pour ne montrer que les activités liées à leurs projets
        if (!$user->hasRole('admin')) {
            $projectIds = $user->projects()->pluck('projects.id');
            
            $query->where(function($q) use ($projectIds, $user) {
                // Activités sur les projets de l'utilisateur
                $q->whereHasMorph('subject', 'App\Models\Project', 
                    function($q) use ($projectIds) {
                        $q->whereIn('id', $projectIds);
                    }
                )
                // Activités sur les tâches des projets de l'utilisateur
                ->orWhereHasMorph('subject', 'App\Models\Task',
                    function($q) use ($projectIds) {
                        $q->whereIn('project_id', $projectIds);
                    }
                )
                // Activités sur les fichiers des projets de l'utilisateur
                ->orWhereHasMorph('subject', 'App\Models\File',
                    function($q) use ($projectIds) {
                        $q->whereIn('project_id', $projectIds);
                    }
                )
                // Ou activités effectuées par l'utilisateur
                ->orWhere('user_id', $user->id);
            });
        }
        
        // Filtres additionnels
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }
        
        $activities = $query->orderByDesc('created_at')->paginate(30)->withQueryString();
        
        // Pour le filtre des utilisateurs, ne montrer que les utilisateurs pertinents
        $usersQuery = $user->hasRole('admin') 
            ? User::query() 
            : User::whereIn('id', 
                Activity::where(function($q) use ($user) {
                    $projectIds = $user->projects()->pluck('projects.id');
                    
                    $q->whereHasMorph('subject', 'App\Models\Project', 
                        function($q) use ($projectIds) {
                            $q->whereIn('id', $projectIds);
                        }
                    )->orWhereHasMorph('subject', 'App\Models\Task',
                        function($q) use ($projectIds) {
                            $q->whereIn('project_id', $projectIds);
                        }
                    )->orWhereHasMorph('subject', 'App\Models\File',
                        function($q) use ($projectIds) {
                            $q->whereIn('project_id', $projectIds);
                        }
                    )->orWhere('user_id', $user->id);
                })->pluck('user_id')
            );
            
        $users = $usersQuery->orderBy('name')->get(['id', 'name']);
        $types = Activity::select('type')->distinct()->pluck('type');
        
        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'users' => $users,
            'filters' => $request->only('user_id', 'type', 'date'),
            'types' => $types,
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $query = Activity::with('user');
        
        // Appliquer le même filtrage que pour l'index
        if (!$user->hasRole('admin')) {
            $projectIds = $user->projects()->pluck('projects.id');
            
            $query->where(function($q) use ($projectIds, $user) {
                // Activités sur les projets de l'utilisateur
                $q->whereHasMorph('subject', 'App\Models\Project', 
                    function($q) use ($projectIds) {
                        $q->whereIn('id', $projectIds);
                    }
                )
                // Activités sur les tâches des projets de l'utilisateur
                ->orWhereHasMorph('subject', 'App\Models\Task',
                    function($q) use ($projectIds) {
                        $q->whereIn('project_id', $projectIds);
                    }
                )
                // Activités sur les fichiers des projets de l'utilisateur
                ->orWhereHasMorph('subject', 'App\Models\File',
                    function($q) use ($projectIds) {
                        $q->whereIn('project_id', $projectIds);
                    }
                )
                // Ou activités effectuées par l'utilisateur
                ->orWhere('user_id', $user->id);
            });
        }
        
        // Appliquer les filtres additionnels
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }
        
        $activities = $query->orderByDesc('created_at')->get();
        return Excel::download(new ActivitiesExport($activities), 'activities.xlsx');
    }

    public function show($id)
    {
        $activity = \App\Models\Activity::with('user')->findOrFail($id);
        // Charger l'objet lié si possible
        $subject = null;
        if ($activity->subject_type && $activity->subject_id) {
            $subjectModel = app($activity->subject_type);
            $relations = [];
            if ($activity->subject_type === 'App\\Models\\File') {
                $relations = ['user', 'project', 'task'];
            } elseif ($activity->subject_type === 'App\\Models\\Task') {
                $relations = ['assignedUser', 'project'];
            } elseif ($activity->subject_type === 'App\\Models\\Project') {
                $relations = ['users'];
            } elseif ($activity->subject_type === 'App\\Models\\User') {
                $relations = ['roles'];
            }
            $subject = $subjectModel->with($relations)->find($activity->subject_id);
        }
        return Inertia::render('Activities/Show', [
            'activity' => $activity,
            'subject' => $subject,
        ]);
    }

    public function notifications()
    {
        $activities = \App\Models\Activity::with('user')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
        return response()->json($activities->map(function($a) {
            return [
                'id' => $a->id,
                'message' => $a->notification_message,
                'created_at' => $a->created_at,
                'read_at' => null, // à gérer si besoin
                'url' => route('activities.show', $a->id),
                'user' => $a->user ? $a->user->name : null,
                'type' => $a->type,
            ];
        }));
    }
}
