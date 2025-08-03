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
        // Utilisation du service Dropbox enregistré dans le conteneur
        $this->dropbox = app('dropbox');
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
                'use_filename' => 'sometimes|boolean',
                'custom_filename' => 'nullable|string|max:255'
            ]);

            // Définir les valeurs par défaut
            $validated['use_filename'] = $validated['use_filename'] ?? false;
            $validated['custom_filename'] = $validated['custom_filename'] ?? null;

            $path = trim($validated['path'], '/');
            if (empty($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le chemin du dossier ne peut pas être vide.'
                ], 400);
            }

            $file = File::findOrFail($fileId);
            
            // Vérifier si le fichier existe dans le stockage public
            if (!Storage::disk('public')->exists($file->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier source n\'existe pas dans le stockage public.'
                ], 404);
            }

            // Déterminer le nom du fichier
            $filename = $validated['use_filename'] && !empty($validated['custom_filename']) 
                ? $validated['custom_filename'] 
                : basename($file->file_path);

            // Chemin complet sur Dropbox
            $dropboxPath = '/' . trim($path, '/') . '/' . $filename;

            // Lire le contenu du fichier depuis le stockage public
            $fileContent = Storage::disk('public')->get($file->file_path);

            // Téléverser le fichier vers Dropbox
            $this->dropbox->upload($dropboxPath, $fileContent);

            // Obtenir le lien de partage
            $sharedLink = $this->dropbox->createSharedLinkWithSettings($dropboxPath, [
                'requested_visibility' => 'public'
            ]);

            // Mettre à jour le modèle de fichier avec le lien Dropbox
            $file->update([
                'dropbox_path' => $dropboxPath,
                'dropbox_link' => $sharedLink['url'] ?? null,
                'storage_provider' => 'dropbox'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier téléversé avec succès sur Dropbox.',
                'data' => [
                    'dropbox_path' => $dropboxPath,
                    'dropbox_link' => $sharedLink['url'] ?? null
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du téléversement vers Dropbox : ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du téléversement du fichier.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharge un fichier depuis Dropbox vers le stockage local
     * 
     * @param int $fileId
     * @return \Illuminate\Http\JsonResponse
     */
    public function downloadFromDropbox($fileId)
    {
        try {
            $file = File::findOrFail($fileId);
            
            if (empty($file->dropbox_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun fichier associé sur Dropbox.'
                ], 404);
            }

            // Télécharger le contenu depuis Dropbox
            $fileContent = $this->dropbox->download($file->dropbox_path);
            
            // Sauvegarder localement
            $localPath = 'downloads/' . basename($file->dropbox_path);
            Storage::disk('local')->put($localPath, $fileContent);

            // Mettre à jour le modèle de fichier
            $file->update([
                'path' => $localPath,
                'storage_provider' => 'local',
                'downloaded_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier téléchargé avec succès depuis Dropbox.',
                'data' => [
                    'local_path' => $localPath
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du téléchargement depuis Dropbox : ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du téléchargement du fichier.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un fichier de Dropbox
     * 
     * @param int $fileId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteFromDropbox($fileId)
    {
        try {
            $file = File::findOrFail($fileId);
            
            if (empty($file->dropbox_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun fichier associé sur Dropbox.'
                ], 404);
            }

            // Supprimer le fichier de Dropbox
            $this->dropbox->delete($file->dropbox_path);

            // Mettre à jour le modèle de fichier
            $file->update([
                'dropbox_path' => null,
                'dropbox_link' => null,
                'storage_provider' => 'local'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier supprimé avec succès de Dropbox.'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression depuis Dropbox : ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du fichier.',
                'error' => $e->getMessage()
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
