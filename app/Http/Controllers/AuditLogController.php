<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AuditLogController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $user = auth()->user();
        $query = AuditLog::with(['project', 'user'])
            ->whereHas('project.users', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('is_muted', false);
            });

        if ($request->search) {
            $query->where('action', 'like', '%'.$request->search.'%');
        }
        $auditLogs = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'filters' => $request->only('search'),
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        $this->authorize('view', $auditLog);
        $auditLog->load(['project', 'user']);
        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }
}