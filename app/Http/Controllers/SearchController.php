<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\File;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = trim($request->input('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'tasks' => [], 'projects' => [], 'files' => [], 'users' => [],
            ]);
        }

        $user = Auth::user();
        $isAdmin = $user->is_admin || ($user->role === 'admin');

        // ── Projets accessibles à l'utilisateur ──────────────────────
        $accessibleProjectIds = $isAdmin
            ? Project::pluck('id')
            : $user->projects()->pluck('projects.id'); // adapte selon ta relation réelle

        // ── Tâches ────────────────────────────────────────────────────
        $tasks = Task::query()
            ->whereIn('project_id', $accessibleProjectIds)
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->with('project:id,name')
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'type' => 'task',
                'title' => $t->title,
                'subtitle' => $t->project?->name,
                'url' => "/tasks/{$t->id}",
            ]);

        // ── Projets ───────────────────────────────────────────────────
        $projects = Project::query()
            ->whereIn('id', $accessibleProjectIds)
            ->where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'type' => 'project',
                'title' => $p->name,
                'subtitle' => 'Projet',
                'url' => "/projects/{$p->id}",
            ]);

        // ── Fichiers ──────────────────────────────────────────────────
        $files = File::query()
            ->whereIn('project_id', $accessibleProjectIds)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'type' => 'file',
                'title' => $f->name,
                'subtitle' => 'Fichier',
                'url' => "/files/{$f->id}",
            ]);

        // ── Utilisateurs (membres visibles par l'utilisateur courant) ──
        $users = User::query()
            ->where('name', 'like', "%{$query}%")
            ->when(!$isAdmin, function ($q) use ($accessibleProjectIds) {
                $q->whereHas('projects', fn($sub) =>
                    $sub->whereIn('projects.id', $accessibleProjectIds)
                );
            })
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'type' => 'user',
                'title' => $u->name,
                'subtitle' => $u->email ? null : null, // pas d'email exposé, cf. sanitization existante
                'url' => "/users/{$u->id}",
            ]);

        return response()->json([
            'tasks' => $tasks,
            'projects' => $projects,
            'files' => $files,
            'users' => $users,
        ]);
    }
}