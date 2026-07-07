<?php
namespace App\Http\Middleware;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Closure;
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
    
    public function handle($request, Closure $next)
{
    $response = parent::handle($request, $next);
    // 🔥 Si ce n'est pas une requête Inertia, forcer HTML
    if (!$request->header('X-Inertia')) {
        if ($response instanceof \Inertia\Response) {
            return response()->view('app', [
                'page' => $response->toArray()
            ]);
        }
    }
    return $response;
}
    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $auth = [
            'user' => null,
        ];
        if ($request->user()) {
            $auth['user'] = [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'profile_photo_url' => $request->user()->profile_photo_url ?? null,
                'notifications' => $request->user()->notifications()->latest()->take(20)->get(),
                'unreadNotificationsCount' => $request->user()->unreadNotifications()->count(),
            ];
        }
        return [
            ...parent::share($request),
            'auth' => $auth,
            'appName' => config('app.name'),
        ];
    }
}