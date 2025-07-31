<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Sprint;
use App\Models\Project;
use App\Models\User;
use App\Models\File;
use App\Models\Activity; 
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Récupération des statistiques de base
        $stats = [
            'tasks' => Task::count(),
            'sprints' => Sprint::count(),
            'projects' => Project::count(),
            'users' => User::count(),
            'files' => File::count(),
            'auditLogs' => DB::table('audit_logs')->count(),
            'members' => DB::table('project_user')->count(),
            // Statistiques des tâches par statut
            'tasksByStatus' => [
                'todo' => Task::where('status', 'todo')->count(),
                'in_progress' => Task::where('status', 'in_progress')->count(),
                'done' => Task::where('status', 'done')->count(),
                'en_attente' => Task::where('status', 'en_attente')->count(),
            ],
        ];

        // Activités récentes (depuis la table activities)
        $recentActivities = Activity::with(['user', 'subject'])
            ->latest()
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
        $activityByDay = Activity::select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(function ($item) {
                return [
                    'day' => $item->day,
                    'count' => $item->count
                ];
            });

        // Top utilisateurs actifs (basé sur les activités)
        $topUsers = Activity::select(
                'user_id',
                DB::raw('count(*) as activity_count')
            )
            ->with('user')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('user_id')
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
        $recentProjects = Project::with(['users' => function($query) {
            $query->wherePivot('role', 'manager');
        }])
        ->latest()
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
        $recentFiles = File::with(['user', 'project', 'task'])
            ->latest()
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