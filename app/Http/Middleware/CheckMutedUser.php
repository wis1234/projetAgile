<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;

class CheckMutedUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): mixed
    {
        try {
            $user = $request->user();
            
            // Skip if user is not authenticated
            if (!$user) {
                return $next($request);
            }

            // Get the current project from the route if available
            $project = $request->route('project') ?? $request->route('project_id');

            // If no project context, check global mute status
            if (!$project) {
                return $next($request);
            }

            // If project is an ID, load the project model
            if (is_numeric($project)) {
                $project = \App\Models\Project::find($project);
            }

            // Skip if project not found
            if (!$project) {
                return $next($request);
            }

            // Check if user is muted for this project
            $projectUser = $project->users()->where('user_id', $user->id)->first();

            // Skip if user is not associated with the project or not muted
            if (!$projectUser || !$projectUser->pivot->is_muted) {
                return $next($request);
            }

            $currentRoute = $request->route()?->getName();

            // Always allow viewing sprints
            if (str_starts_with((string)$currentRoute, 'sprints.') && $request->isMethod('get')) {
                return $next($request);
            }

            // Allow viewing tasks but restrict other actions
            if (str_starts_with((string)$currentRoute, 'tasks.')) {
                if ($request->isMethod('get') && !in_array($currentRoute, [
                    'tasks.resources',
                    'tasks.discussions',
                    'tasks.files',
                    'tasks.attachments',
                    'tasks.download',
                ])) {
                    return $next($request);
                }

                // Block access to task resources and discussions
                if (in_array($currentRoute, [
                    'tasks.resources',
                    'tasks.discussions',
                    'tasks.files',
                    'tasks.attachments',
                    'tasks.download',
                ])) {
                    return $this->denyAccess($request, 'Access to task resources and discussions is restricted for muted users');
                }
            }

            // Block file operations
            if ((is_string($currentRoute) && str_starts_with($currentRoute, 'files.')) || 
                str_contains($request->path(), 'files/') || 
                $request->is('api/files*')) {
                return $this->denyAccess($request, 'File operations are restricted for muted users');
            }

            // Block message operations
            if ((is_string($currentRoute) && str_starts_with($currentRoute, 'messages.')) || 
                str_contains($request->path(), 'messages/') || 
                $request->is('api/messages*')) {
                return $this->denyAccess($request, 'Messaging is restricted for muted users');
            }

            // Block discussions
            if (str_contains($request->path(), 'discussions') || 
                str_contains($request->path(), 'comments') || 
                $request->is('api/*comments*') || 
                $request->is('api/*discussions*')) {
                return $this->denyAccess($request, 'Discussions are restricted for muted users');
            }

            // Allow other read operations
            if ($request->isMethod('get')) {
                return $next($request);
            }

            // Block all other write operations
            return $this->denyAccess($request, 'Write operations are restricted for muted users');

        } catch (\Exception $e) {
            // Log the error but don't block the request in case of error
            Log::error('Error in CheckMutedUser middleware', [
                'user_id' => $user->id ?? 'Unknown',
                'request_url' => $request->url(),
                'request_method' => $request->method(),
                'route' => $request->route()?->getName(),
                'error' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ]);

            // In case of error, deny access by default for security
            return Response::json([
                'error' => 'Access verification failed',
                'error_code' => 'ACCESS_VERIFICATION_FAILED',
                'details' => 'An error occurred while verifying your access level',
            ], 500);
        }
    }

    /**
     * Deny access with a proper response
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $message
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    protected function denyAccess(Request $request, string $message)
    {
        Log::warning('Muted user access denied', [
            'user_id' => $request->user()?->id,
            'url' => $request->url(),
            'method' => $request->method(),
            'route' => $request->route()?->getName(),
            'message' => $message,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return Response::json([
                'error' => 'Access Denied',
                'message' => $message,
                'error_code' => 'MUTED_USER_ACCESS_DENIED',
            ], 403);
        }

        return back()->with('error', $message);
    }
}
