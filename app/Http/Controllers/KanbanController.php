<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('viewAny', \App\Models\Sprint::class);

        $user = auth()->user();

        if ($user->hasRole('admin')) {
            $tasks = Task::orderBy('position')->get();
        } else {
            $projectIds = $user->projects()->wherePivot('role', 'manager')->pluck('projects.id');
            $tasks = Task::whereIn('project_id', $projectIds)->orderBy('position')->get();
        }

        return Inertia::render('Kanban/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function updateOrder(Request $request)
    {
        $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|integer|exists:tasks,id',
            'tasks.*.status' => 'required|string|in:todo,in_progress,done',
            'tasks.*.position' => 'required|integer',
        ]);

        $tasks = $request->input('tasks');

        try {
            DB::transaction(function () use ($tasks) {
                foreach ($tasks as $taskData) {
                    $task = Task::find($taskData['id']);
                    $this->authorize('update', $task);
                    $task->update([
                        'status' => $taskData['status'],
                        'position' => $taskData['position'],
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Le tableau Kanban a été mis à jour avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Échec de la mise à jour du tableau Kanban.');
        }
    }
}
