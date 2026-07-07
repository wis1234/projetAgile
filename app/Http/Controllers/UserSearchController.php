<?php


// ══════════════════════════════════════════════════════════════
//  app/Http/Controllers/UserSearchController.php
// ══════════════════════════════════════════════════════════════
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserSearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->input('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['users' => []]);
        }

        $users = User::where(function ($query) use ($q) {
            $query->where('name',  'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%");
        })
        ->select('id', 'name', 'email', 'profile_photo_path')
        ->limit(8)
        ->get();

        return response()->json(['users' => $users]);
    }
}
