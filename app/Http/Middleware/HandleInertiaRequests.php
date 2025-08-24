<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Get project ID and context from the request
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return array{id: int|null, context: string|null}
     */
    protected function getProjectFromRequest(Request $request): array
    {
        $projectId = null;
        $context = null;
        
        // Check route parameters first
        if ($project = $request->route('project')) {
            $projectId = is_object($project) ? $project->id : $project;
            $context = $request->route()->getName();
            return ['id' => $projectId, 'context' => $context];
        }

        // Check for project_id in request data
        if ($projectId = $request->input('project_id')) {
            return ['id' => $projectId, 'context' => $request->path()];
        }

        // Check for project in the URL segments
        $segments = $request->segments();
        $projectIndex = array_search('projects', $segments);
        
        if ($projectIndex !== false && isset($segments[$projectIndex + 1])) {
            $potentialId = $segments[$projectIndex + 1];
            if (is_numeric($potentialId)) {
                $context = $request->path();
                return ['id' => (int) $potentialId, 'context' => $context];
            }
        }

        return ['id' => null, 'context' => null];
    }

    /**
     * Define the props that are shared by default.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $auth = [
            'user' => null,
            'project' => null,
        ];

        if ($user = $request->user()) {
            // Basic user info
            $auth['user'] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo_url' => $user->profile_photo_url ?? null,
                'notifications' => $user->notifications()->latest()->take(20)->get(),
                'unreadNotificationsCount' => $user->unreadNotifications()->count(),
                'roles' => $user->roles->pluck('name')->toArray(),
            ];

            // Project context
            $projectInfo = $this->getProjectFromRequest($request);
            
            if ($projectInfo['id']) {
                $project = $user->projects()->find($projectInfo['id']);
                
                if ($project) {
                    $pivot = $project->pivot;
                    
                    // Add project info to auth
                    $auth['project'] = [
                        'id' => $project->id,
                        'name' => $project->name,
                        'slug' => $project->slug,
                        'is_muted' => (bool) $pivot->is_muted,
                        'muted_until' => $pivot->muted_until,
                        'role' => $pivot->role,
                        'context' => $projectInfo['context'],
                    ];
                    
                    // Also add to user for backward compatibility
                    $auth['user']['is_muted'] = (bool) $pivot->is_muted;
                    $auth['user']['muted_until'] = $pivot->muted_until;
                    $auth['user']['current_project_role'] = $pivot->role;
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => $auth,
            'appName' => config('app.name'),
        ];
    }
}
