<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sprint;
use App\Models\Project;
use Inertia\Inertia;
use App\Events\SprintUpdated;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SprintController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Sprint::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        
        // Récupération des sprints avec pagination
        $perPage = $request->input('per_page', 10);
        
        // Récupération des données paginées
        $sprints = Sprint::with(['project' => function($query) {
                $query->select('id', 'name');
            }])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('start_date', 'desc')
            ->paginate($perPage)
            ->withQueryString();
            
        // Transformation des données pour le frontend
        $sprints->getCollection()->transform(function ($sprint) {
            return [
                'id' => $sprint->id,
                'name' => $sprint->name,
                'description' => $sprint->description,
                'start_date' => $sprint->start_date,
                'end_date' => $sprint->end_date,
                'status' => $sprint->status,
                'project' => $sprint->project ? [
                    'id' => $sprint->project->id,
                    'name' => $sprint->project->name,
                ] : null,
                'created_at' => $sprint->created_at,
                'updated_at' => $sprint->updated_at,
            ];
        });
            
        return Inertia::render('Sprints/Index', [
            'sprints' => $sprints,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $this->authorize('create', Sprint::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $currentUser = auth()->user();
        $projects = $currentUser->hasRole('admin')
            ? Project::all(['id', 'name'])
            : $currentUser->projects()->wherePivot('role', 'manager')->get(['projects.id', 'projects.name']);
        return Inertia::render('Sprints/Create', [
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $this->authorize('create', Sprint::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'project_id' => 'required|exists:projects,id',
        ]);
        $sprint = Sprint::create($validated);
        event(new SprintUpdated($sprint));
        return redirect()->route('sprints.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sprint = Sprint::with(['project', 'tasks.assignedUser'])->findOrFail($id);
        try {
            $this->authorize('view', $sprint);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        return Inertia::render('Sprints/Show', [
            'sprint' => $sprint,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $sprint = Sprint::findOrFail($id);
        try {
            $this->authorize('update', $sprint);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $projects = Project::all(['id', 'name']);
        return Inertia::render('Sprints/Edit', [
            'sprint' => $sprint,
            'projects' => $projects,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $sprint = Sprint::findOrFail($id);
        try {
            $this->authorize('update', $sprint);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'project_id' => 'required|exists:projects,id',
        ]);
        $sprint->update($validated);
        event(new SprintUpdated($sprint));
        return redirect()->route('sprints.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $sprint = Sprint::findOrFail($id);
        try {
            $this->authorize('delete', $sprint);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $sprint->delete();
        event(new SprintUpdated($sprint));
        return redirect()->route('sprints.index');
    }
}
