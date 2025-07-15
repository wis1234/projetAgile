<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Sprint;
use App\Models\Project;
use App\Models\User;
use App\Models\File;
use App\Models\Message;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'tasks' => Task::count(),
            'sprints' => Sprint::count(),
            'projects' => Project::count(),
            'users' => User::count(),
            'files' => File::count(),
            'messages' => Message::count(),
            'auditLogs' => AuditLog::count(),
            'members' => DB::table('project_user')->count(),
        ];
        // Statistiques d'évolution sur 30 jours
        $activityByDay = DB::table('audit_logs')
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('day')
            ->orderBy('day')
            ->get();
        // Top utilisateurs actifs
        $topUsers = DB::table('audit_logs')
            ->join('users', 'audit_logs.user_id', '=', 'users.id')
            ->select('users.name', DB::raw('count(*) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();
        // Activités récentes
        $recentActivities = AuditLog::with('user', 'project')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'activityByDay' => $activityByDay,
            'topUsers' => $topUsers,
            'recentActivities' => $recentActivities,
        ]);
    }
} 