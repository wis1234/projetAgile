<?php

namespace App\Http\Controllers;

use App\Exports\ActivitiesExport;
use App\Models\Activity;
use App\Models\ActivityRead;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ActivityController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Activity::with(['user.roles'])
            ->visibleTo($user);

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $activities = $query->orderByDesc('created_at')->paginate(30)->withQueryString();

        $users = $this->filterUsersForActivities($user);
        $types = Activity::visibleTo($user)->select('type')->distinct()->orderBy('type')->pluck('type');
        $stats = [
            'total' => Activity::visibleTo($user)->count(),
            'today' => Activity::visibleTo($user)->whereDate('created_at', today())->count(),
        ];

        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'users' => $users,
            'filters' => $request->only('user_id', 'type', 'date', 'search'),
            'types' => $types,
            'typeLabels' => Activity::typeLabels(),
            'stats' => $stats,
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $query = Activity::with('user')->visibleTo($user);

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $activities = $query->orderByDesc('created_at')->get();

        return Excel::download(new ActivitiesExport($activities), 'activities.xlsx');
    }

    public function show(Request $request, Activity $activity)
    {
        $user = $request->user();

        $visible = Activity::query()
            ->where('id', $activity->id)
            ->visibleTo($user)
            ->exists();

        abort_unless($visible, 403);

        $activity->load(['user.roles']);

        $subject = null;
        if ($activity->subject_type && $activity->subject_id) {
            $subjectModel = app($activity->subject_type);
            $relations = match ($activity->subject_type) {
                'App\\Models\\File' => ['user', 'project', 'task'],
                'App\\Models\\Task' => ['assignedUser', 'project'],
                'App\\Models\\Project' => ['users'],
                'App\\Models\\User' => ['roles'],
                'App\\Models\\TaskComment' => ['user', 'task.project'],
                'App\\Models\\Sprint' => ['project'],
                default => [],
            };
            $subject = $subjectModel->with($relations)->find($activity->subject_id);
        }

        return Inertia::render('Activities/Show', [
            'activity' => $activity,
            'subject' => $subject,
            'typeLabels' => Activity::typeLabels(),
        ]);
    }

    public function notifications(Request $request)
    {
        $user = $request->user();
        $lastReadAt = ActivityRead::where('user_id', $user->id)->value('last_read_at');

        $activities = Activity::with('user')
            ->visibleTo($user)
            ->where('user_id', '!=', $user->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $payload = $activities->map(function (Activity $activity) use ($lastReadAt) {
            $isRead = $lastReadAt && $activity->created_at <= $lastReadAt;

            return $activity->toNotificationPayload($isRead);
        });

        $unreadCount = Activity::visibleTo($user)
            ->where('user_id', '!=', $user->id)
            ->when($lastReadAt, fn ($q) => $q->where('created_at', '>', $lastReadAt))
            ->count();

        return response()->json([
            'activities' => $payload,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markNotificationsRead(Request $request)
    {
        ActivityRead::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['last_read_at' => now()]
        );

        return response()->json(['success' => true]);
    }

    protected function filterUsersForActivities(User $user)
    {
        if ($user->hasRole('admin')) {
            return User::orderBy('name')->get(['id', 'name']);
        }

        $userIds = Activity::visibleTo($user)->distinct()->pluck('user_id')->filter();

        return User::whereIn('id', $userIds)->orderBy('name')->get(['id', 'name']);
    }
}
