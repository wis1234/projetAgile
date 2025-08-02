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

    /**
     * Télécharge un fichier vers Dropbox avec un chemin de dossier et un nom de fichier personnalisés
     * 
     * @param int $fileId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadToDropbox($fileId, Request $request)
    {
        try {
            $validated = $request->validate([
                'folder_path' => 'required|string',
                'file_name' => 'required|string|max:255',
            ]);
            
            $folderPath = trim($validated['folder_path'], '/');
            $fileName = $validated['file_name'];
            
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
            $fileExtension = pathinfo($file->file_path, PATHINFO_EXTENSION);
            $dropboxPath = '/' . $folderPath . '/' . $fileName . ($fileExtension ? '.' . $fileExtension : '');
            
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
                // Créer le dossier s'il n'existe pas
                $this->createDirectoryIfNotExists($folderPath);
                
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

    /**
     * Récupère la liste des dossiers dans un chemin Dropbox spécifique
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function listFolders(Request $request)
    {
        try {
            $path = $request->input('path', '');
            $path = trim($path, '/');
            
            Log::info('Liste des dossiers Dropbox demandée', ['path' => $path]);
            
            // Si le chemin est vide, on liste le contenu de la racine
            $dropboxPath = $path === '' ? '' : "/$path";
            
            try {
                // Récupérer la liste des dossiers
                $response = $this->dropbox->listFolder($dropboxPath, false);
                
                // Filtrer pour ne garder que les dossiers
                $folders = array_filter($response['entries'], function($entry) {
                    return $entry['.tag'] === 'folder';
                });
                
                // Trier les dossiers par nom
                usort($folders, function($a, $b) {
                    return strcasecmp($a['name'], $b['name']);
                });
                
                // Formater les données pour le frontend
                $formattedFolders = array_map(function($folder) use ($path) {
                    return [
                        'name' => $folder['name'],
                        'path_lower' => $folder['path_lower'],
                        'path_display' => $folder['path_display'],
                        'id' => $folder['id']
                    ];
                }, $folders);
                
                Log::info('Dossiers récupérés avec succès', [
                    'path' => $path,
                    'count' => count($formattedFolders)
                ]);
                
                return response()->json([
                    'success' => true,
                    'folders' => array_values($formattedFolders), // Réindexer le tableau
                    'path' => $path
                ]);
                
            } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                Log::error('Erreur Dropbox (BadRequest)', [
                    'message' => $e->getMessage(),
                    'path' => $path,
                    'code' => $e->getCode()
                ]);
                
                // Si le dossier n'existe pas, retourner un tableau vide
                if (strpos($e->getMessage(), 'not_found') !== false) {
                    return response()->json([
                        'success' => true,
                        'folders' => [],
                        'path' => $path
                    ]);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des dossiers: ' . $e->getMessage(),
                    'code' => $e->getCode()
                ], 400);
                
            } catch (\Exception $e) {
                Log::error('Erreur lors de la récupération des dossiers Dropbox', [
                    'message' => $e->getMessage(),
                    'path' => $path,
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des dossiers: ' . $e->getMessage(),
                    'code' => $e->getCode()
                ], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans listFolders', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue est survenue: ' . $e->getMessage(),
                'code' => $e->getCode()
            ], 500);
        }
    }

    /**
     * Crée un nouveau dossier dans Dropbox
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createFolder(Request $request)
    {
        try {
            $validated = $request->validate([
                'path' => 'required|string',
                'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9 _-]+$/'],
            ]);
            
            $basePath = trim($validated['path'], '/');
            $folderName = trim($validated['name']);
            $folderPath = $basePath === '' ? "/$folderName" : "/$basePath/$folderName";
            
            Log::info('Création de dossier Dropbox demandée', [
                'base_path' => $basePath,
                'folder_name' => $folderName,
                'full_path' => $folderPath
            ]);
            
            try {
                // Créer le dossier
                $folderMetadata = $this->dropbox->createFolder($folderPath);
                
                Log::info('Dossier créé avec succès', [
                    'path' => $folderPath,
                    'metadata' => $folderMetadata
                ]);
                
                // Récupérer les informations du dossier créé
                $folderInfo = [
                    'name' => $folderName,
                    'path_lower' => strtolower($folderPath),
                    'path_display' => $folderPath,
                    'id' => $folderMetadata['id'] ?? null
                ];
                
                return response()->json([
                    'success' => true,
                    'message' => 'Dossier créé avec succès',
                    'folder' => $folderInfo
                ]);
                
            } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                // Vérifier si l'erreur est due à un dossier existant
                if (strpos($e->getMessage(), 'path/conflict/folder/') !== false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Un dossier avec ce nom existe déjà.'
                    ], 409);
                }
                
                // Autre erreur
                throw $e;
            }
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in createFolder', [
                'errors' => $e->errors(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans createFolder', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée un dossier et ses parents s'ils n'existent pas
     * 
     * @param string $path Chemin du dossier à créer
     * @return void
     */
    protected function createDirectoryIfNotExists($path)
    {
        try {
            $path = trim($path, '/');
            if (empty($path)) {
                return; // Racine, rien à créer
            }
            
            $parts = explode('/', $path);
            $currentPath = '';
            
            foreach ($parts as $part) {
                $currentPath = $currentPath === '' ? $part : "$currentPath/$part";
                $fullPath = "/$currentPath";
                
                try {
                    // Essayer de créer le dossier
                    $this->dropbox->createFolder($fullPath);
                    Log::info("Dossier créé: $fullPath");
                } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                    // Le dossier existe déjà, on continue
                    if (strpos($e->getMessage(), 'path/conflict/folder/') === false) {
                        // Autre erreur que le conflit de dossier existant
                        Log::warning("Erreur lors de la création du dossier $fullPath", [
                            'error' => $e->getMessage()
                        ]);
                        throw $e;
                    }
                }
            }
            
        } catch (\Exception $e) {
            Log::error("Erreur dans createDirectoryIfNotExists pour le chemin: $path", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
