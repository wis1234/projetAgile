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
        $query = Activity::with('user');
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
        $users = \App\Models\User::orderBy('name')->get(['id', 'name']);
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
        $query = Activity::with('user');
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
