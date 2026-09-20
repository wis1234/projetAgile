<?php

namespace App\Http\Controllers;

use App\Models\ParticipationPoint;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Bonus de participation : points attribués à ceux qui s'impliquent pendant les formations.
 * Ils s'ajoutent (plafonnés) à la note finale lors de la sélection.
 *
 * Le bonus est attribué dans le cadre d'un QUIZ, à ses MEMBRES (les candidats inscrits au quiz,
 * à ne pas confondre avec les membres du projet). Les anciens bonus « généraux » du projet
 * (sans quiz) restent gérés par les méthodes index/store/destroy ci-dessous.
 */
class ParticipationPointController extends Controller
{
    // ------------------------------------------------------------------
    // Bonus par quiz : destinataires = membres du quiz
    // ------------------------------------------------------------------

    public function quizIndex(Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $memberIds = $this->quizMemberIds($quiz);
        $enrolled = $quiz->candidates()->pluck('user_id')->flip();

        $totals = ParticipationPoint::totalsForQuiz($quiz);
        $own = ParticipationPoint::where('quiz_id', $quiz->id)->get();
        $entriesByUser = $own->groupBy('user_id');

        $members = User::whereIn('id', $memberIds)->orderBy('name')->get(['id', 'name', 'email', 'profile_photo_path'])
            ->map(function (User $u) use ($totals, $entriesByUser, $enrolled) {
                $raw = (float) ($totals[$u->id] ?? 0);

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'photo' => $u->profile_photo_url,
                    'total' => round($raw, 2),
                    'effective' => ParticipationPoint::capped($raw),
                    'entries_count' => $entriesByUser->get($u->id, collect())->count(),
                    'enrolled' => $enrolled->has($u->id),
                ];
            })
            ->values();

        return Inertia::render('Quizzes/Participation', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'quiz' => ['id' => $quiz->id, 'title' => $quiz->title, 'validated' => $quiz->isValidated()],
            'members' => $members,
            'history' => $this->history($own->sortByDesc('id')->take(200)->values()),
            'cap' => (float) config('quiz.participation_cap', 10),
            'stepMax' => (float) config('quiz.participation_step_max', 10),
            'legacyCount' => ParticipationPoint::where('project_id', $project->id)->whereNull('quiz_id')->count(),
        ]);
    }

    public function quizStore(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        if ($quiz->isValidated()) {
            return back()->with('error', 'Les résultats sont validés : rouvrez la délibération pour modifier les bonus.');
        }

        $data = $this->validated($request);

        // Seuls les membres du quiz peuvent recevoir un bonus (et non tous les membres du projet).
        if (! in_array((int) $data['user_id'], $this->quizMemberIds($quiz), true)) {
            throw ValidationException::withMessages([
                'user_id' => "Cet utilisateur n'est pas membre de ce quiz. Ajoutez-le d'abord depuis la page du quiz.",
            ]);
        }

        $point = ParticipationPoint::create([
            'project_id' => $project->id,
            'quiz_id' => $quiz->id,
            'user_id' => $data['user_id'],
            'awarded_by' => Auth::id(),
            'points' => $data['points'],
            'reason' => $data['reason'] ?? null,
            'awarded_on' => $data['awarded_on'] ?? now()->toDateString(),
        ]);

        if (function_exists('activity_log')) {
            activity_log('create', sprintf("%+g point(s) de participation attribué(s) à %s (quiz '%s')", $point->points, $point->user?->name, $quiz->title), $quiz);
        }

        return back()->with('success', 'Bonus de participation enregistré.');
    }

    public function quizDestroy(Project $project, Quiz $quiz, ParticipationPoint $participationPoint)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        if ($quiz->isValidated()) {
            return back()->with('error', 'Les résultats sont validés : rouvrez la délibération pour modifier les bonus.');
        }

        $participationPoint->delete();

        return back()->with('success', 'Attribution supprimée.');
    }

    /**
     * Membres du quiz : les candidats inscrits, plus les utilisateurs qui ont déjà passé le quiz
     * (quiz créés avant les inscriptions).
     *
     * @return list<int>
     */
    private function quizMemberIds(Quiz $quiz): array
    {
        return $quiz->candidates()->pluck('user_id')
            ->merge(QuizResult::where('quiz_id', $quiz->id)->whereNotNull('user_id')->pluck('user_id'))
            ->unique()->map(fn ($id) => (int) $id)->values()->all();
    }

    // ------------------------------------------------------------------
    // Anciens bonus généraux du projet (quiz_id NULL)
    // ------------------------------------------------------------------

    public function index(Project $project)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $totals = ParticipationPoint::totalsForProject($project->id);
        $legacy = ParticipationPoint::where('project_id', $project->id)->whereNull('quiz_id');
        $entriesByUser = (clone $legacy)->get()->groupBy('user_id');

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

        return Inertia::render('Quizzes/Participation', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'quiz' => null,
            'members' => $members,
            'history' => $this->history((clone $legacy)->orderByDesc('id')->limit(200)->get()),
            'cap' => (float) config('quiz.participation_cap', 10),
            'stepMax' => (float) config('quiz.participation_step_max', 10),
            'legacyCount' => 0,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $this->validated($request);

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
            activity_log('create', sprintf('%+g point(s) attribué(s) à %s', $point->points, $point->user?->name), $project);
        }

        return back()->with('success', 'Bonus de participation enregistré.');
    }

    public function destroy(Project $project, ParticipationPoint $participationPoint)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        abort_unless($participationPoint->project_id === $project->id && $participationPoint->quiz_id === null, 404);

        $participationPoint->delete();

        return back()->with('success', 'Attribution supprimée.');
    }

    // ------------------------------------------------------------------

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $step = (float) config('quiz.participation_step_max', 10);

        return $request->validate([
            'user_id' => ['required', 'integer'],
            'points' => ['required', 'numeric', 'between:-' . $step . ',' . $step, 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
            'awarded_on' => ['nullable', 'date'],
        ], [
            'points.not_in' => 'Indiquez un nombre de points différent de 0.',
            'points.between' => "Une attribution est limitée à ±{$step} points.",
        ]);
    }

    /** @param Collection<int, ParticipationPoint> $points */
    private function history(Collection $points): Collection
    {
        return $points->load(['user:id,name,profile_photo_path', 'awarder:id,name'])
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
    }
}
