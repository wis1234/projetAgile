<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KanbanController extends Controller
{
    public function index()
    {
        $tasks = Task::orderBy('position')->get()->groupBy('status');
        return Inertia::render('Kanban/Index', [
            'tasks' => $tasks,
        ]);
    }
} 