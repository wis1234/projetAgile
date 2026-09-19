<?php

namespace App\Http\Controllers;

use App\Models\ParticipationPoint;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Bonus de participation : points attribués aux membres qui s'impliquent pendant les formations.
 * Ils s'ajoutent (plafonnés) à la note finale lors de la sélection.
 */
class ParticipationPointController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('manage', [\App\Models\Quiz::class, $project]);

        $totals = ParticipationPoint::totalsForProject($project->id);
        $entriesByUser = ParticipationPoint::where('project_id', $project->id)->get()->groupBy('user_id');

        $members = $project->users()
            ->wherePivot('role', '!=', 'manager')
            ->orderBy('users.name')
            ->get()
            ->map(function ($u) use ($totals, $entriesByUser) {
                $raw = (float) ($totals[$u->id] ?? 0);

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'photo' => $u->profile_photo_url,
                    'total' => round($raw, 2),
                    'effective' => ParticipationPoint::capped($raw),
                    'entries_count' => $entriesByUser->get($u->id, collect())->count(),
                ];
            })
            ->values();

        $history = ParticipationPoint::where('project_id', $project->id)
            ->with(['user:id,name,profile_photo_path', 'awarder:id,name'])
            ->orderByDesc('awarded_on')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'user_name' => $p->user?->name,
                'user_photo' => $p->user?->profile_photo_url,
                'points' => $p->points,
                'reason' => $p->reason,
                'awarded_on' => optional($p->awarded_on)->toDateString(),
                'awarded_by' => $p->awarder?->name,
            ]);

        return Inertia::render('Quizzes/Participation', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'members' => $members,
            'history' => $history,
            'cap' => (float) config('quiz.participation_cap', 10),
            'stepMax' => (float) config('quiz.participation_step_max', 10),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manage', [\App\Models\Quiz::class, $project]);

        $step = (float) config('quiz.participation_step_max', 10);

        $data = $request->validate([
            'user_id' => ['required', 'integer'],
            'points' => ['required', 'numeric', 'between:-' . $step . ',' . $step, 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
            'awarded_on' => ['nullable', 'date'],
        ], [
            'points.not_in' => 'Indiquez un nombre de points différent de 0.',
            'points.between' => "Une attribution est limitée à ±{$step} points.",
        ]);

        abort_unless(
            $project->users()->where('users.id', $data['user_id'])->exists(),
            422,
            'Ce membre ne fait pas partie du projet.'
        );

        $point = ParticipationPoint::create([
            'project_id' => $project->id,
            'user_id' => $data['user_id'],
            'awarded_by' => Auth::id(),
            'points' => $data['points'],
            'reason' => $data['reason'] ?? null,
            'awarded_on' => $data['awarded_on'] ?? now()->toDateString(),
        ]);

        if (function_exists('activity_log')) {
            activity_log('create', 'Bonus de participation', $project, sprintf('%+g point(s) attribué(s) à %s', $point->points, $point->user?->name));
        }

        return back()->with('success', 'Bonus de participation enregistré.');
    }

    public function destroy(Project $project, ParticipationPoint $participationPoint)
    {
        $this->authorize('manage', [\App\Models\Quiz::class, $project]);

        abort_unless($participationPoint->project_id === $project->id, 404);

        $participationPoint->delete();

        return back()->with('success', 'Attribution supprimée.');
    }
}
