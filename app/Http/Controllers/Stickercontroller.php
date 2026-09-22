<?php

namespace App\Http\Controllers;

use App\Models\Sticker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StickerController extends Controller
{
    // Liste tous les stickers du "pack" partagé (visibles par toute l'équipe)
    public function index()
    {
        $stickers = Sticker::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'image_path' => $s->image_path,
                'type' => $s->type ?? 'image',
                'user' => $s->user ? ['id' => $s->user->id, 'name' => $s->user->name] : null,
                'is_mine' => (int) $s->user_id === (int) Auth::id(),
            ]);

        return response()->json($stickers);
    }

    // Upload d'un nouveau sticker : image (png/jpg/gif/webp) ou courte vidéo (mp4/webm/mov)
    public function store(Request $request)
    {
        $request->validate([
            // 6 Mo max : suffisant pour un GIF/vidéo courte, on ne valide pas la durée côté serveur
            // (pas de ffmpeg disponible) mais la taille limite naturellement à des clips courts.
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov,qt|max:6144',
            'name' => 'nullable|string|max:50',
        ]);

        try {
            $file = $request->file('image');
            $isVideo = str_starts_with((string) $file->getMimeType(), 'video/');
            $type = $isVideo ? 'video' : 'image';

            $path = $file->store('stickers', 'public');

            $sticker = Sticker::create([
                'user_id' => Auth::id(),
                'name' => $request->input('name'),
                'image_path' => $path,
                'type' => $type,
            ]);

            $sticker->load('user:id,name');

            return response()->json([
                'id' => $sticker->id,
                'name' => $sticker->name,
                'image_path' => $sticker->image_path,
                'type' => $sticker->type,
                'user' => ['id' => $sticker->user->id, 'name' => $sticker->user->name],
                'is_mine' => true,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Erreur upload sticker', ['error' => $e->getMessage(), 'user_id' => Auth::id()]);
            return response()->json(['message' => "Impossible d'enregistrer ce sticker."], 500);
        }
    }

    // Supprime un sticker (seul son créateur peut le faire)
    public function destroy($id)
    {
        $sticker = Sticker::findOrFail($id);

        if ((int) $sticker->user_id !== (int) Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $sticker->delete();

        return response()->json(['success' => true]);
    }
}