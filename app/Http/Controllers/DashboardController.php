<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Sprint;
use App\Models\Project;
use App\Models\User;
use App\Models\File;
use App\Models\Activity;
use App\Models\Recruitment; 
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isAdmin = $user->hasRole('admin');
        
        // Base query for projects and tasks
        $projectQuery = Project::query();
        $taskQuery = Task::query();
        
        // If not admin, filter by user's projects
        if (!$isAdmin) {
            $userProjectIds = $user->projects()->pluck('projects.id');
            $projectQuery->whereIn('id', $userProjectIds);
            $taskQuery->whereIn('project_id', $userProjectIds);
        }

        // Récupération des statistiques de base
        $stats = [
            'tasks' => $taskQuery->count(),
            'sprints' => $isAdmin ? Sprint::count() : Sprint::whereIn('project_id', $userProjectIds ?? [])->count(),
            'projects' => $projectQuery->count(),
            'users' => $isAdmin ? User::count() : DB::table('project_user')->whereIn('project_id', $userProjectIds)->distinct()->count('user_id'),
            'files' => $isAdmin ? File::count() : File::whereIn('project_id', $userProjectIds)->orWhereIn('task_id', (clone $taskQuery)->pluck('id'))->count(),
            'auditLogs' => $isAdmin ? DB::table('audit_logs')->count() : 0, // Hide audit logs for non-admins
            'members' => $isAdmin ? DB::table('project_user')->count() : 0, // Hide member count for non-admins
            // Statistiques des tâches par statut
            'tasksByStatus' => [
                'todo' => (clone $taskQuery)->where('status', 'todo')->count(),
                'in_progress' => (clone $taskQuery)->where('status', 'in_progress')->count(),
                'done' => (clone $taskQuery)->where('status', 'done')->count(),
                'en_attente' => (clone $taskQuery)->where('status', 'en_attente')->count(),
            ],
            // Statistiques de recrutement
            'recruitments' => $isAdmin ? Recruitment::count() : 0,
            'active_recruitments' => $isAdmin ? Recruitment::where('status', 'published')->count() : 0,
        ];

        // Activités récentes (depuis la table activities)
        $activityQuery = Activity::with(['user', 'subject']);
        
        // Filter activities for non-admin users
        if (!$isAdmin) {
            // Get all project IDs the user has access to
            $userProjectIds = $user->projects()->pluck('projects.id');
            
            // Get all task IDs from those projects
            $userTaskIds = Task::whereIn('project_id', $userProjectIds)->pluck('id');
            
            $activityQuery->where(function($query) use ($user, $userProjectIds, $userTaskIds) {
                // User's own activities
                $query->where('user_id', $user->id)
                    // Or activities related to user's projects
                    ->orWhereHasMorph('subject', [Project::class], function($q) use ($userProjectIds) {
                        $q->whereIn('id', $userProjectIds);
                    })
                    // Or activities related to tasks in user's projects
                    ->orWhereHasMorph('subject', [Task::class], function($q) use ($userTaskIds) {
                        $q->whereIn('id', $userTaskIds);
                    });
            });
        }
        
        $recentActivities = $activityQuery->latest()
            ->take(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'created_at' => $activity->created_at->diffForHumans(),
                    'user' => $activity->user ? [
                        'name' => $activity->user->name,
                        'avatar' => $activity->user->profile_photo_url ?? null,
                    ] : null,
                    'subject' => $activity->subject_type ? [
                        'type' => class_basename($activity->subject_type),
                        'id' => $activity->subject_id,
                    ] : null,
                ];
            });

        // Statistiques d'activité sur 30 jours (depuis la table activities)
        $activityByDayQuery = Activity::select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(30));
            
        // Filter activities for non-admin users
        if (!$isAdmin) {
            $activityByDayQuery->where(function($query) use ($user, $userProjectIds, $userTaskIds) {
                $query->where('user_id', $user->id)
                    ->orWhereHasMorph('subject', [Project::class], function($q) use ($userProjectIds) {
                        $q->whereIn('id', $userProjectIds);
                    })
                    ->orWhereHasMorph('subject', [Task::class], function($q) use ($userTaskIds) {
                        $q->whereIn('id', $userTaskIds);
                    });
            });
        }
        
        $activityByDay = $activityByDayQuery->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(function ($item) {
                return [
                    'day' => $item->day,
                    'count' => $item->count
                ];
            });

        // Top utilisateurs actifs (basé sur les activités)
        $topUsersQuery = Activity::select(
                'user_id',
                DB::raw('count(*) as activity_count')
            )
            ->with('user')
            ->where('created_at', '>=', now()->subDays(30));
            
        // Filter activities for non-admin users
        if (!$isAdmin) {
            $topUsersQuery->where(function($query) use ($user, $userProjectIds, $userTaskIds) {
                $query->where('user_id', $user->id)
                    ->orWhereHasMorph('subject', [Project::class], function($q) use ($userProjectIds) {
                        $q->whereIn('id', $userProjectIds);
                    })
                    ->orWhereHasMorph('subject', [Task::class], function($q) use ($userTaskIds) {
                        $q->whereIn('id', $userTaskIds);
                    });
            });
        }
        
        $topUsers = $topUsersQuery->groupBy('user_id')
            ->orderByDesc('activity_count')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->user_id,
                    'name' => $item->user->name ?? 'Utilisateur inconnu',
                    'count' => $item->activity_count,
                    'avatar' => $item->user->profile_photo_url ?? null,
                ];
            });

        // Projets récents
        $recentProjectsQuery = Project::with(['users' => function($query) {
            $query->wherePivot('role', 'manager');
        }]);
        
        // Filter projects for non-admin users
        if (!$isAdmin) {
            $recentProjectsQuery->whereIn('id', $userProjectIds);
        }
        
        $recentProjects = $recentProjectsQuery->latest()
            ->take(5)
            ->get()
            ->map(function ($project) {
                $manager = $project->users->first();
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'status' => $project->status,
                    'deadline' => $project->deadline,
                    'task_count' => $project->tasks()->count(),
                    'manager' => $manager ? [
                        'name' => $manager->name,
                        'avatar' => $manager->profile_photo_url ?? null,
                    ] : [
                        'name' => 'Aucun gestionnaire',
                        'avatar' => null
                    ],
                ];
            });

        // Fichiers récents
        $recentFilesQuery = File::with(['user', 'project', 'task']);
        
        // Filter files for non-admin users
        if (!$isAdmin) {
            $recentFilesQuery->where(function($query) use ($user, $userProjectIds, $userTaskIds) {
                $query->where('user_id', $user->id)
                    ->orWhereIn('project_id', $userProjectIds)
                    ->orWhereIn('task_id', $userTaskIds);
            });
        }
        
        $recentFiles = $recentFilesQuery->latest()
            ->take(5)
            ->get()
            ->map(function ($file) {
                $attachable = null;
                if ($file->project) {
                    $attachable = [
                        'type' => 'Project',
                        'id' => $file->project_id,
                        'name' => $file->project->name
                    ];
                } elseif ($file->task) {
                    $attachable = [
                        'type' => 'Task',
                        'id' => $file->task_id,
                        'name' => $file->task->name
                    ];
                }

                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $this->formatBytes($file->size),
                    'type' => $file->mime_type,
                    'created_at' => $file->created_at->diffForHumans(),
                    'url' => $file->getUrl(),
                    'user' => $file->user ? [
                        'name' => $file->user->name,
                        'avatar' => $file->user->profile_photo_url ?? null,
                    ] : null,
                    'attachable' => $attachable,
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'activityByDay' => $activityByDay,
            'recentActivities' => $recentActivities,
            'topUsers' => $topUsers,
            'recentProjects' => $recentProjects,
            'recentFiles' => $recentFiles,
        ]);
    }

    /**
     * Formate la taille des fichiers en unités lisibles
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}