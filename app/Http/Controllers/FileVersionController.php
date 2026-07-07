<?php

// ══════════════════════════════════════════════════════════════
//  app/Http/Controllers/FileVersionController.php
// ══════════════════════════════════════════════════════════════
namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileVersion;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class FileVersionController extends Controller
{
    use AuthorizesRequests;

    // GET /files/{file}/versions — liste les versions
    public function index(File $file)
    {
        $this->authorize('viewHistory', $file);

        $versions = $file->versions()
            ->with('user:id,name,email,profile_photo_url')
            ->select('id','file_id','user_id','label','summary','version_number','created_at')
            ->paginate(20);

        return response()->json($versions);
    }

    // GET /files/{file}/versions/{version} — contenu d'une version
    public function show(File $file, FileVersion $version)
    {
        $this->authorize('viewHistory', $file);

        abort_if($version->file_id !== $file->id, 404);

        return response()->json([
            'version' => $version->load('user:id,name,profile_photo_url'),
        ]);
    }

    // POST /files/{file}/versions — snapshot manuel (appelé depuis updateContent)
    public function store(Request $request, File $file)
    {
        $this->authorize('update', $file);

        $request->validate([
            'content' => 'required|string',
            'label'   => 'nullable|string|max:100',
            'summary' => 'nullable|string|max:255',
        ]);

        $lastVersion = $file->versions()->max('version_number') ?? 0;

        $version = FileVersion::create([
            'file_id'        => $file->id,
            'user_id'        => auth()->id(),
            'content'        => $request->content,
            'label'          => $request->label,
            'summary'        => $request->summary,
            'version_number' => $lastVersion + 1,
        ]);

        return response()->json(['version' => $version->load('user:id,name,profile_photo_url')], 201);
    }

    // POST /files/{file}/versions/{version}/restore — restaurer une version
    public function restore(File $file, FileVersion $version)
    {
        $this->authorize('restoreVersion', $file);

        abort_if($version->file_id !== $file->id, 404);

        // Snapshot de l'état actuel avant écrasement
        $currentContent = \Storage::disk('public')->get(
            preg_replace('/^public\//', '', $file->file_path)
        );
        $lastVersion = $file->versions()->max('version_number') ?? 0;

        FileVersion::create([
            'file_id'        => $file->id,
            'user_id'        => auth()->id(),
            'content'        => $currentContent ?? '',
            'label'          => 'Auto-save avant restauration',
            'summary'        => "Sauvegarde automatique avant restauration de la v{$version->version_number}",
            'version_number' => $lastVersion + 1,
        ]);

        // Écrire le contenu restauré sur disque
        $path = preg_replace('/^public\//', '', $file->file_path);
        \Storage::disk('public')->put($path, $version->content);

        $file->update([
            'size'             => \Storage::disk('public')->size($path),
            'last_modified_by' => auth()->id(),
            'updated_at'       => now(),
        ]);

        activity_log('restore', "Restauration vers v{$version->version_number}", $file);

        return response()->json(['message' => "Version {$version->version_number} restaurée avec succès"]);
    }
}
