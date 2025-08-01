<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;
use App\Models\File;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client as GuzzleClient;

class DropboxController extends Controller
{
    protected $dropbox;

    public function __construct()
    {
        // Configuration du client HTTP personnalisé pour ignorer la vérification SSL en environnement local
        $httpClient = new GuzzleClient([
            'verify' => app()->environment('local') ? false : true,
        ]);

        $this->dropbox = new DropboxClient(
            config('filesystems.disks.dropbox.authorization_token'),
            $httpClient
        );
    }

    public function uploadToDropbox($fileId)
    {
        try {
            $file = File::findOrFail($fileId);
            
            // Vérifier si le fichier existe localement
            $localPath = 'public/' . ltrim($file->file_path, '/');
            
            if (!Storage::exists($localPath)) {
                Log::error('Fichier non trouvé localement', [
                    'file_id' => $file->id,
                    'path' => $localPath,
                    'storage_path' => storage_path('app/' . $localPath)
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier n\'existe pas sur le serveur.'
                ], 404);
            }
            
            $filePath = storage_path('app/' . $localPath);
            $fileName = basename($file->file_path);
            $dropboxPath = '/AgileManager/' . ($file->project_id ?? 'no-project') . '/' . $fileName;
            
            Log::info('Tentative d\'upload vers Dropbox', [
                'file_id' => $file->id,
                'local_path' => $filePath,
                'dropbox_path' => $dropboxPath,
                'file_exists' => file_exists($filePath),
                'is_readable' => is_readable($filePath),
                'file_size' => filesize($filePath) . ' bytes'
            ]);
            
            // Vérifier si le fichier est lisible
            if (!is_readable($filePath)) {
                $error = error_get_last();
                Log::error('Fichier non lisible', [
                    'file_id' => $file->id,
                    'path' => $filePath,
                    'error' => $error ? $error['message'] : 'Inconnu',
                    'permissions' => substr(sprintf('%o', fileperms($filePath)), -4)
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de lire le fichier. Vérifiez les permissions.'
                ], 500);
            }
            
            // Lire le contenu du fichier
            $fileContent = file_get_contents($filePath);
            if ($fileContent === false) {
                $error = error_get_last();
                throw new \Exception('Impossible de lire le contenu du fichier: ' . ($error['message'] ?? 'Inconnu'));
            }
            
            // Téléverser le fichier
            Log::info('Téléversement vers Dropbox en cours...', [
                'file_id' => $file->id,
                'dropbox_path' => $dropboxPath,
                'content_length' => strlen($fileContent) . ' bytes'
            ]);
            
            try {
                $result = $this->dropbox->upload($dropboxPath, $fileContent, 'overwrite');
                
                Log::info('Réponse de Dropbox', [
                    'file_id' => $file->id,
                    'response' => json_encode($result)
                ]);
                
                // Mettre à jour le statut du fichier dans la base de données
                $file->dropbox_path = $dropboxPath;
                $file->save();
                
                Log::info('Fichier sauvegardé avec succès sur Dropbox', [
                    'file_id' => $file->id,
                    'dropbox_path' => $dropboxPath,
                    'size' => $file->size
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Fichier sauvegardé sur Dropbox avec succès',
                    'path' => $dropboxPath
                ]);
                
            } catch (\Exception $uploadException) {
                $errorDetails = [
                    'message' => $uploadException->getMessage(),
                    'code' => $uploadException->getCode(),
                    'file' => $uploadException->getFile(),
                    'line' => $uploadException->getLine(),
                ];
                
                if ($uploadException->getPrevious() instanceof \GuzzleHttp\Exception\ClientException) {
                    $response = $uploadException->getPrevious()->getResponse();
                    $errorDetails['response'] = [
                        'status' => $response->getStatusCode(),
                        'body' => (string) $response->getBody()
                    ];
                }
                
                Log::error('Erreur lors de l\'upload vers Dropbox', $errorDetails);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'upload vers Dropbox: ' . $uploadException->getMessage(),
                    'details' => $errorDetails
                ], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la sauvegarde sur Dropbox', [
                'file_id' => $fileId ?? 'inconnu',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'previous' => $e->getPrevious() ? $e->getPrevious()->getMessage() : null
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde sur Dropbox: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}
