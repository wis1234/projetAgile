<?php

namespace App\Http\Controllers;

use App\Models\Sticker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
                'user' => $s->user ? ['id' => $s->user->id, 'name' => $s->user->name] : null,
                'is_mine' => (int) $s->user_id === (int) Auth::id(),
            ]);

        return response()->json($stickers);
    }

    // Upload d'un nouveau sticker (image ou GIF)
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:2048', // Max 2MB
            'name' => 'nullable|string|max:50',
        ]);

        $path = $request->file('image')->store('stickers', 'public');

        $sticker = Sticker::create([
            'user_id' => Auth::id(),
            'name' => $request->input('name'),
            'image_path' => $path,
        ]);

        $sticker->load('user:id,name');

        return response()->json([
            'id' => $sticker->id,
            'name' => $sticker->name,
            'image_path' => $sticker->image_path,
            'user' => ['id' => $sticker->user->id, 'name' => $sticker->user->name],
            'is_mine' => true,
        ], 201);
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