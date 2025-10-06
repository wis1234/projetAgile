<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class ZoomService
{
    protected $clientId;
    protected $clientSecret;
    protected $accountId;
    protected $baseUrl = 'https://api.zoom.us/v2';
    protected $token;
    protected $tokenExpiresAt;

    public function __construct()
    {
        $this->clientId = config('services.zoom.client_id');
        $this->clientSecret = config('services.zoom.client_secret');
        $this->accountId = config('services.zoom.account_id');
    }

    /**
     * Get access token for Zoom API
     */
    protected function getAccessToken()
    {
        // Si le token est toujours valide, on le renvoie
        if ($this->token && $this->tokenExpiresAt && $this->tokenExpiresAt->isFuture()) {
            return $this->token;
        }

        try {
            // Configuration pour le développement local - Désactive la vérification SSL
            $client = new \GuzzleHttp\Client([
                'verify' => app()->environment('production') ? true : false,
            ]);

            $response = $client->post('https://zoom.us/oauth/token', [
                'auth' => [$this->clientId, $this->clientSecret],
                'form_params' => [
                    'grant_type' => 'account_credentials',
                    'account_id' => $this->accountId,
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            $this->token = $data['access_token'];
            $this->tokenExpiresAt = now()->addSeconds($data['expires_in'] - 60);
            
            return $this->token;
            
        } catch (\Exception $e) {
            throw new \Exception('Impossible d\'obtenir le token d\'accès Zoom: ' . $e->getMessage());
        }
    }

    /**
     * Create a new Zoom meeting
     */
    public function createMeeting(array $data, string $userId)
    {
        $token = $this->getAccessToken();
        
        try {
            $client = new \GuzzleHttp\Client([
                'verify' => app()->environment('production') ? true : false,
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ]
            ]);

            $response = $client->post("$this->baseUrl/users/$userId/meetings", [
                'json' => [
                    'topic' => $data['topic'],
                    'type' => 2, // Scheduled meeting
                    'start_time' => $data['start_time'],
                    'duration' => $data['duration'] ?? 60, // Default 60 minutes
                    'timezone' => config('app.timezone'),
                    'password' => $this->generateMeetingPassword(),
                    'settings' => [
                        'host_video' => true,
                        'participant_video' => true,
                        'join_before_host' => false,
                        'mute_upon_entry' => true,
                        'waiting_room' => true,
                        'approval_type' => 1, // Manually approve participants
                        'auto_recording' => 'cloud',
                    ],
                ]
            ]);

            return json_decode($response->getBody(), true);
            
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $response = $e->getResponse();
            $error = json_decode($response->getBody()->getContents(), true);
            throw new \Exception('Erreur lors de la création de la réunion Zoom: ' . ($error['message'] ?? $e->getMessage()));
        }
    }

    /**
     * Delete a Zoom meeting
     */
    public function deleteMeeting(string $meetingId)
    {
        $token = $this->getAccessToken();
        
        $response = Http::withToken($token)
            ->delete("$this->baseUrl/meetings/$meetingId");

        return $response->successful();
    }

    /**
     * Get meeting details
     */
    public function getMeeting(string $meetingId)
    {
        $token = $this->getAccessToken();
        
        $response = Http::withToken($token)
            ->get("$this->baseUrl/meetings/$meetingId");

        if ($response->successful()) {
            return $response->json();
        }

        throw new \Exception('Erreur lors de la récupération des détails de la réunion Zoom: ' . $response->body());
    }

    /**
     * Generate a random password for the meeting
     */
    /**
     * Get user details by email
     */
    public function getUserByEmail($email)
    {
        $token = $this->getAccessToken();
        
        try {
            $client = new \GuzzleHttp\Client([
                'verify' => app()->environment('production') ? true : false,
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json',
                ]
            ]);

            $response = $client->get("$this->baseUrl/users/$email");
            return json_decode($response->getBody(), true);
            
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $response = $e->getResponse();
            $error = json_decode($response->getBody()->getContents(), true);
            throw new \Exception('Impossible de trouver l\'utilisateur Zoom: ' . ($error['message'] ?? $e->getMessage()));
        }
    }

    /**
     * Generate a random password for the meeting
     */
    protected function generateMeetingPassword()
    {
        return substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 10);
    }
}
