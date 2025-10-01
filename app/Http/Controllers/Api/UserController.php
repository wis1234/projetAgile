<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Search for a user by email
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function searchByEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'project_id' => 'nullable|exists:projects,id'
        ]);

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun utilisateur trouvé avec cet email.'
                ], 404);
            }

            // Check if user is already a member of the project
            if ($request->project_id) {
                $project = Project::find($request->project_id);
                
                if ($project->users()->where('user_id', $user->id)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cet utilisateur est déjà membre du projet.'
                    ], 422);
                }
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->profile_photo_url,
                    'roles' => $user->getRoleNames()
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in searchByEmail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la recherche de l\'utilisateur.'
            ], 500);
        }
    }
}
