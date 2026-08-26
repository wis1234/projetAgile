<?php
namespace App\Http\Middleware;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function handle(Request $request, \Closure $next)
    {
        $response = parent::handle($request, $next);

        $response->headers->set('Vary', 'X-Inertia');
        if ($request->header('X-Inertia')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
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
        'share_discussions_by_email' => (bool) $request->user()->share_discussions_by_email,
    ];
}

        return [
            ...parent::share($request),
            'auth' => $auth,
            'appName' => config('app.name'),
        ];
    }
}