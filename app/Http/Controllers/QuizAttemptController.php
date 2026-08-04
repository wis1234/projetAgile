<?php

namespace App\Http\Controllers;

use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizAttemptController extends Controller
{
    public function saveProgress(Request $request, QuizAttempt $attempt)
    {
        if ($attempt->user_id !== Auth::id()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        if ($attempt->status === 'completed') {
            return response()->json(['error' => 'Tentative déjà terminée'], 400);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $attempt->update([
            'answers' => $validated['answers'],
        ]);

        return response()->json(['success' => true]);
    }
}
