<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Spatie\Dropbox\Client as DropboxClient;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Handler\CurlHandler;
use GuzzleHttp\Middleware;
use Psr\Http\Message\RequestInterface;
use Illuminate\Support\Facades\Cache;

class DropboxServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../../config/dropbox.php', 'dropbox'
        );

        $this->app->singleton('dropbox', function ($app) {
            $config = $app['config']['dropbox'];
            
            // Create a handler stack with the default middleware
            $stack = new HandlerStack();
            $stack->setHandler(new CurlHandler());
            
            // Create a custom Guzzle client with SSL verification disabled
            $httpClient = new GuzzleClient([
                'handler' => $stack,
                'verify' => $app->environment('production') ? true : false,
            ]);
            
            // Create a simple Dropbox client with the custom HTTP client
            $client = new class($config['access_token'] ?? '', null, 1024 * 1024) extends DropboxClient {
                protected $customHttpClient;
                
                public function setCustomHttpClient($httpClient)
                {
                    $this->customHttpClient = $httpClient;
                }
                
                protected function getHttpClient()
                {
                    return $this->customHttpClient ?? parent::getHttpClient();
                }
            };
            
            $client->setCustomHttpClient($httpClient);
            
            // Handle refresh token if available
            if (!empty($config['refresh_token'])) {
                $accessToken = $this->getRefreshedAccessToken($config, $httpClient);
                $client = new class($accessToken, null, 1024 * 1024) extends DropboxClient {
                    protected $customHttpClient;
                    
                    public function setCustomHttpClient($httpClient)
                    {
                        $this->customHttpClient = $httpClient;
                    }
                    
                    protected function getHttpClient()
                    {
                        return $this->customHttpClient ?? parent::getHttpClient();
                    }
                };
                $client->setCustomHttpClient($httpClient);
            }

            return $client;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../../config/dropbox.php' => config_path('dropbox.php'),
        ], 'config');
    }

    /**
     * Obtient un nouveau token d'accès à partir du refresh token
     */
    protected function getRefreshedAccessToken(array $config, $httpClient)
    {
        $cacheKey = 'dropbox_access_token';
        
        // Vérifier si un token valide est en cache
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Obtenir un nouveau token avec le refresh token
        $response = $httpClient->post('https://api.dropbox.com/oauth2/token', [
            'form_params' => [
                'grant_type' => 'refresh_token',
                'refresh_token' => $config['refresh_token'],
                'client_id' => $config['client_id'],
                'client_secret' => $config['client_secret'],
            ],
        ]);

        $data = json_decode($response->getBody()->getContents(), true);
        
        // Mettre en cache le nouveau token (avec une durée de vie de 3h, bien que le token Dropbox dure 4h)
        $expiresIn = $data['expires_in'] ?? 14400; // 4 heures par défaut
        Cache::put($cacheKey, $data['access_token'], now()->addSeconds($expiresIn - 3600)); // On rafraîchit 1h avant l'expiration

        return $data['access_token'];
    }
}
