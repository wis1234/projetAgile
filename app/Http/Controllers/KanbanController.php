<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class KanbanController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('viewAny', \App\Models\Sprint::class);

        $user = auth()->user();

        if ($user->hasRole('admin')) {
            $tasks = Task::orderBy('position')->get()->groupBy('status');
        } else {
            // Get tasks only for projects where user is manager
            $projectIds = $user->projects()->wherePivot('role', 'manager')->pluck('projects.id');
            $tasks = Task::whereIn('project_id', $projectIds)->orderBy('position')->get()->groupBy('status');
        }

        return Inertia::render('Kanban/Index', [
            'tasks' => $tasks,
        ]);
    }
}
