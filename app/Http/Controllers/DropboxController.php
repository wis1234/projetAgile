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
                'path' => 'required|string',
                'use_filename' => 'boolean',
                'custom_filename' => 'nullable|string'
            ]);

            $path = trim($validated['path'], '/');
            if (empty($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le chemin du dossier ne peut pas être vide.'
                ], 422);
            }

            $file = File::findOrFail($fileId);
            $localPath = 'public/' . ltrim($file->file_path, '/');

            if (!Storage::exists($localPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier n\'existe pas sur le serveur.'
                ], 404);
            }

            $filePath = storage_path('app/' . $localPath);
            $fileContent = file_get_contents($filePath);
            
            // Déterminer le nom du fichier à utiliser
            $fileName = $validated['custom_filename'] ?? $file->name;
            
            // Construire le chemin Dropbox final
            $dropboxPath = '/' . trim($path, '/') . '/' . $fileName;

            // Créer le dossier de destination s'il n'existe pas
            $this->createDirectoryIfNotExists(dirname($dropboxPath));

            $result = $this->dropbox->upload($dropboxPath, $fileContent, 'overwrite');

            $file->dropbox_path = $dropboxPath;
            $file->save();

            return response()->json([
                'success' => true,
                'message' => 'Fichier sauvegardé sur Dropbox avec succès',
                'path' => $dropboxPath
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la sauvegarde sur Dropbox', [
                'file_id' => $fileId ?? 'inconnu',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde sur Dropbox: ' . $e->getMessage(),
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
            $dropboxPath = $path === '' ? '' : '/' . $path;

            try {
                $response = $this->dropbox->listFolder($dropboxPath, false);
                $folders = array_filter($response['entries'], function ($entry) {
                    return $entry['.tag'] === 'folder';
                });

                return response()->json([
                    'success' => true,
                    'folders' => array_values($folders)
                ]);

            } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                if (strpos($e->getMessage(), 'not_found') !== false) {
                    return response()->json(['success' => true, 'folders' => []]);
                }
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des dossiers Dropbox', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des dossiers: ' . $e->getMessage()
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
            ]);

            $path = trim($validated['path'], '/');
            if (empty($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le nom du dossier ne peut pas être vide.'
                ], 422);
            }

            Log::info('Création de dossier Dropbox demandée', [
                'full_path' => $path
            ]);

            try {
                // Vérifier si le dossier existe déjà
                try {
                    $this->dropbox->getMetadata('/' . $path);
                    return response()->json([
                        'success' => false,
                        'message' => 'Un dossier avec ce nom existe déjà.'
                    ], 409);
                } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                    // Le dossier n'existe pas, on peut continuer
                }

                // Créer le dossier
                $folderMetadata = $this->dropbox->createFolder('/' . $path);

                Log::info('Dossier créé avec succès', [
                    'path' => '/' . $path,
                    'metadata' => $folderMetadata
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Dossier créé avec succès',
                    'folder' => $folderMetadata
                ]);

            } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
                Log::error('Erreur lors de la création du dossier', [
                    'path' => '/' . $path,
                    'error' => $e->getMessage()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création du dossier: ' . $e->getMessage()
                ], 400);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
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
        $path = trim($path, '/');
        if (empty($path)) {
            return;
        }

        try {
            $this->dropbox->getMetadata('/' . $path);
        } catch (\Spatie\Dropbox\Exceptions\BadRequest $e) {
            // Le dossier n'existe pas, nous le créons
            $this->dropbox->createFolder('/' . $path);
        }
    }
}
