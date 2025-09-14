<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyRecaptcha
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ne pas vérifier en environnement de test
        if (app()->environment('testing')) {
            return $next($request);
        }

        $token = $request->input('recaptcha_token');
        
        if (empty($token)) {
            return response()->json([
                'message' => 'reCAPTCHA token is required.'
            ], 400);
        }

        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret_key'),
            'response' => $token,
            'remoteip' => $request->ip()
        ]);

        $data = $response->json();

        if (!$data['success'] || $data['score'] < 0.5) {
            Log::warning('reCAPTCHA verification failed', [
                'success' => $data['success'] ?? false,
                'score' => $data['score'] ?? null,
                'errors' => $data['error-codes'] ?? [],
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'message' => 'reCAPTCHA verification failed. Please try again.'
            ], 400);
        }

        return $next($request);
    }
}
