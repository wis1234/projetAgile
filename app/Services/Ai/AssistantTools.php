<?php

namespace App\Services\Ai;

use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\FileController;
use App\Models\AiPendingAction;
use App\Models\File;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Outils que l'assistant peut appeler. Principes :
 *  - lecture : toujours restreinte aux projets de l'utilisateur (l'admin voit tout) ;
 *  - écriture : exécutée par les MÊMES contrôleurs que l'interface (validation, droits, notifications, journal d'activité) ;
 *  - jamais d'argent (montants, paiements, retraits) ni de rôles/permissions : hors du périmètre de l'IA ;
 *  - suppression : jamais directe, uniquement après confirmation explicite de l'utilisateur dans l'interface.
 */
class AssistantTools
{
    use \App\Services\Ai\Concerns\AssistantExtras;
    use \App\Services\Ai\Concerns\QuizExtras;

    private const LINK_PREFIXES = ['/dashboard', '/projects', '/tasks', '/kanban', '/discussions', '/inbox', '/files', '/remunerations', '/users', '/project-users', '/profile', '/calendar', '/notifications', '/assistant', '/quizzes'];

    /** @param array $features lecture/écriture de fichiers, membres, rapports (réglages du tableau de bord) */
    public function __construct(private User $user, private array $features = [])
    {
    }

    // ───────────────────────── Définitions envoyées au modèle ─────────────────────────

    public static function definitions(array $features = []): array
    {
        $all = self::baseDefinitions();
        // list_files / read_file sont remplacés par les versions avancées (pagination, liens, formats Office/PDF)
        $drop = ['list_files', 'read_file'];
        if (!($features['files_write'] ?? true)) {
            $drop[] = 'append_task_tracking';
        }
        $all = array_values(array_filter($all, fn ($d) => !in_array($d['name'], $drop, true)));

        return array_merge($all, self::extraDefinitions($features), self::quizDefinitions());
    }

    private static function baseDefinitions(): array
    {
        $int = ['type' => 'integer'];
        $str = ['type' => 'string'];

        return [
            [
                'name' => 'my_overview',
                'description' => "Vue d'ensemble de l'utilisateur : ses tâches par statut, tâches en retard, échéances des 7 prochains jours, nombre de projets et solde de gains (lecture seule).",
                'input_schema' => ['type' => 'object', 'properties' => new \stdClass()],
            ],
            [
                'name' => 'list_projects',
                'description' => "Liste les projets auxquels l'utilisateur a accès (id, nom, statut, son rôle, nombre de membres et de tâches).",
                'input_schema' => ['type' => 'object', 'properties' => ['search' => $str]],
            ],
            [
                'name' => 'get_project',
                'description' => "Détails d'un projet : description, membres et rôles, sprints (avec le sprint en cours) et répartition des tâches par statut.",
                'input_schema' => ['type' => 'object', 'properties' => ['project_id' => $int], 'required' => ['project_id']],
            ],
            [
                'name' => 'list_tasks',
                'description' => "Liste des tâches visibles par l'utilisateur, avec filtres. Utiliser assignee='me' pour « mes tâches ».",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int,
                    'status' => ['type' => 'string', 'enum' => ['todo', 'in_progress', 'done']],
                    'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high']],
                    'assignee' => ['type' => 'string', 'description' => "'me' ou l'identifiant numérique d'un utilisateur"],
                    'overdue' => ['type' => 'boolean', 'description' => 'Uniquement les tâches en retard et non terminées'],
                    'due_within_days' => $int,
                    'search' => $str,
                    'limit' => ['type' => 'integer', 'description' => '1 à 30 (défaut 15)'],
                ]],
            ],
            [
                'name' => 'get_task',
                'description' => "Détails complets d'une tâche : description, statut, priorité, échéance, assigné, sprint, projet, derniers commentaires.",
                'input_schema' => ['type' => 'object', 'properties' => ['task_id' => $int], 'required' => ['task_id']],
            ],
            [
                'name' => 'list_sprints',
                'description' => "Sprints d'un projet (id, nom, dates, en cours ou non).",
                'input_schema' => ['type' => 'object', 'properties' => ['project_id' => $int], 'required' => ['project_id']],
            ],
            [
                'name' => 'search_users',
                'description' => "Cherche des personnes (par nom) parmi les membres des projets de l'utilisateur. Sert à retrouver l'identifiant d'un assigné.",
                'input_schema' => ['type' => 'object', 'properties' => ['query' => $str], 'required' => ['query']],
            ],
            [
                'name' => 'list_files',
                'description' => "Recherche les documents ProJA consultables par l'utilisateur. Toujours utiliser cet outil avant read_file pour retrouver les fichiers.",
                'input_schema' => ['type' => 'object', 'properties' => ['project_id' => $int, 'search' => $str]],
            ],
            [
                'name' => 'read_file',
                'description' => "Lit un document texte ProJA si l'utilisateur a le droit de le consulter et si le fichier n'est pas verrouillé par mot de passe. Utiliser uniquement un file_id obtenu avec list_files.",
                'input_schema' => ['type' => 'object', 'properties' => ['file_id' => $int], 'required' => ['file_id']],
            ],
            [
                'name' => 'append_task_tracking',
                'description' => "Ajoute une note horodatée à la fin du fichier de suivi HTML d'une tâche. Réservé aux utilisateurs autorisés à modifier ce document. Le contenu est ajouté sans remplacer l'existant et une version est sauvegardée.",
                'input_schema' => ['type' => 'object', 'properties' => ['task_id' => $int, 'entry' => ['type' => 'string', 'description' => 'Note à ajouter au suivi']], 'required' => ['task_id', 'entry']],
            ],
            [
                'name' => 'create_task',
                'description' => "Crée une tâche dans un projet (réservé aux managers du projet et aux admins). Le sprint en cours est utilisé par défaut. Ne gère PAS les montants/paiements.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int,
                    'title' => $str,
                    'description' => $str,
                    'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high']],
                    'status' => ['type' => 'string', 'enum' => ['todo', 'in_progress', 'done']],
                    'due_date' => ['type' => 'string', 'description' => 'AAAA-MM-JJ ou AAAA-MM-JJ HH:MM'],
                    'assigned_to' => ['type' => 'integer', 'description' => "Identifiant d'un membre du projet"],
                    'sprint_id' => $int,
                ], 'required' => ['project_id', 'title']],
            ],
            [
                'name' => 'update_task',
                'description' => "Modifie une tâche existante (réservé aux managers du projet et aux admins) : titre, description, statut, priorité, échéance, assigné, sprint. Seuls les champs fournis changent. Pour retirer l'assigné ou l'échéance, passer null.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'task_id' => $int,
                    'title' => $str,
                    'description' => $str,
                    'status' => ['type' => 'string', 'enum' => ['todo', 'in_progress', 'done']],
                    'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high']],
                    'due_date' => ['type' => ['string', 'null']],
                    'assigned_to' => ['type' => ['integer', 'null']],
                    'sprint_id' => $int,
                ], 'required' => ['task_id']],
            ],
            [
                'name' => 'add_comment',
                'description' => "Ajoute un commentaire dans la discussion d'une tâche, au nom de l'utilisateur.",
                'input_schema' => ['type' => 'object', 'properties' => ['task_id' => $int, 'content' => $str], 'required' => ['task_id', 'content']],
            ],
            [
                'name' => 'delete_task',
                'description' => "Demande la suppression d'une tâche. Rien n'est supprimé tant que l'utilisateur n'a pas cliqué sur « Confirmer » dans l'interface : après l'appel, dis-lui simplement de confirmer.",
                'input_schema' => ['type' => 'object', 'properties' => ['task_id' => $int], 'required' => ['task_id']],
            ],
            [
                'name' => 'open_page',
                'description' => "Propose à l'utilisateur un bouton pour ouvrir une page de ProJA (ex. /tasks/12, /projects/3, /remunerations, /discussions).",
                'input_schema' => ['type' => 'object', 'properties' => ['path' => $str, 'label' => $str], 'required' => ['path']],
            ],
        ];
    }

    /**
     * Exécute un outil. Retourne ['result' => données pour le modèle, 'action' => carte UI éventuelle, 'pending' => AiPendingAction éventuelle].
     */
    public function run(string $name, array $input, ?int $conversationId = null): array
    {
        try {
            return match ($name) {
                'my_overview' => $this->wrap($this->myOverview()),
                'list_projects' => $this->wrap($this->listProjects($input)),
                'get_project' => $this->wrap($this->getProject($input)),
                'list_tasks' => $this->wrap($this->listTasks($input)),
                'get_task' => $this->wrap($this->getTask($input)),
                'list_sprints' => $this->wrap($this->listSprints($input)),
                'search_users' => $this->wrap($this->searchUsers($input)),
                'list_files' => $this->wrap($this->listFilesSmart($input)),
                'read_file' => $this->wrap($this->readFileSmart($input)),
                'search_files_content' => $this->wrap($this->searchFilesContent($input)),
                'append_task_tracking' => $this->feature('files_write') ? $this->appendTaskTracking($input) : $this->wrap($this->disabled("L'écriture dans les fichiers par l'assistant")),
                'add_project_member' => $this->addProjectMember($input),
                'change_member_role' => $this->changeMemberRole($input),
                'remove_project_member' => $this->requestRemoveMember($input, $conversationId),
                'generate_report' => $this->generateReport($input),
                'create_task' => $this->createTask($input),
                'update_task' => $this->updateTask($input),
                'add_comment' => $this->addComment($input),
                'delete_task' => $this->requestDeleteTask($input, $conversationId),
                'open_page' => $this->openPage($input),
                'list_quizzes' => $this->wrap($this->listQuizzes($input)),
                'get_quiz' => $this->wrap($this->getQuiz($input)),
                'create_quiz' => $this->wrap($this->createQuiz($input)),
                'update_quiz' => $this->wrap($this->updateQuiz($input)),
                'add_quiz_candidate' => $this->wrap($this->addQuizCandidate($input)),
                'get_quiz_attempt_to_grade' => $this->wrap($this->getQuizAttemptToGrade($input)),
                'submit_quiz_grades' => $this->wrap($this->submitQuizGrades($input)),
                default => $this->wrap(['error' => "Outil inconnu : {$name}"]),
            };
        } catch (\Throwable $e) {
            Log::error('AI tool error', ['tool' => $name, 'error' => $e->getMessage()]);
            return $this->wrap(['error' => "L'opération a échoué (erreur interne)."]);
        }
    }

    /** Exécution réelle d'une action confirmée par l'utilisateur. */
    public function runConfirmed(AiPendingAction $action): array
    {
        return match ($action->tool) {
            'delete_task' => $this->deleteTask((int) ($action->input['task_id'] ?? 0)),
            'remove_project_member' => $this->removeProjectMember(
                (int) ($action->input['project_id'] ?? 0),
                (int) ($action->input['user_id'] ?? 0),
                (bool) ($action->input['unassign_open_tasks'] ?? false)
            ),
            default => ['ok' => false, 'message' => 'Action inconnue.'],
        };
    }

    private function wrap(array $result, ?array $action = null): array
    {
        return ['result' => $result, 'action' => $action];
    }

    // ───────────────────────── Accès / périmètre ─────────────────────────

    private function isAdmin(): bool
    {
        return $this->user->hasAdminAccess();
    }

    /** Projets accessibles (non muté). */
    private function visibleProjectIds(): array
    {
        if ($this->isAdmin()) {
            return Project::pluck('id')->all();
        }
        return DB::table('project_user')->where('user_id', $this->user->id)->where('is_muted', false)->pluck('project_id')->all();
    }

    private function managerProjectIds(): array
    {
        if ($this->isAdmin()) {
            return Project::pluck('id')->all();
        }
        return DB::table('project_user')->where('user_id', $this->user->id)->where('role', 'manager')->where('is_muted', false)->pluck('project_id')->all();
    }

    private function myRole(int $projectId): ?string
    {
        return DB::table('project_user')->where('user_id', $this->user->id)->where('project_id', $projectId)->value('role');
    }

    private function clip(?string $text, int $max = 600): ?string
    {
        if ($text === null) {
            return null;
        }
        $text = trim(strip_tags($text));
        return mb_strlen($text) > $max ? mb_substr($text, 0, $max) . '…' : $text;
    }

    private function taskRow(Task $t): array
    {
        return [
            'id' => $t->id,
            'title' => $t->title,
            'status' => $t->status,
            'priority' => $t->priority,
            'due_date' => $t->due_date?->format('Y-m-d H:i'),
            'overdue' => $t->status !== 'done' && $t->due_date && $t->due_date->isPast(),
            'project' => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name] : null,
            'assignee' => $t->assignedUser ? ['id' => $t->assignedUser->id, 'name' => $t->assignedUser->name, 'link' => $this->mdLink($t->assignedUser->name, "/users/{$t->assignedUser->id}")] : null,
            'url' => "/tasks/{$t->id}",
            'link' => $this->mdLink($t->title, "/tasks/{$t->id}"),
            'project_link' => $t->project ? $this->mdLink($t->project->name, "/projects/{$t->project->id}") : null,
        ];
    }

    private function parseDate(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        $dt = Carbon::parse($value);
        if (!preg_match('/\d{1,2}:\d{2}/', $value)) {
            $dt->setTime(18, 0, 0);
        }
        return $dt->format('Y-m-d H:i:s');
    }

    // ───────────────────────── Lecture ─────────────────────────

    private function myOverview(): array
    {
        $ids = $this->visibleProjectIds();
        $mine = Task::whereIn('project_id', $ids)->where('assigned_to', $this->user->id);

        $byStatus = (clone $mine)->select('status', DB::raw('count(*) c'))->groupBy('status')->pluck('c', 'status');
        $overdue = (clone $mine)->where('status', '!=', 'done')->whereNotNull('due_date')->where('due_date', '<', now())
            ->with('project:id,name')->orderBy('due_date')->limit(5)->get();
        $upcoming = (clone $mine)->where('status', '!=', 'done')->whereBetween('due_date', [now(), now()->addDays(7)])
            ->with('project:id,name')->orderBy('due_date')->limit(8)->get();

        $wallet = app(WalletService::class)->summary($this->user->id);

        return [
            'today' => now()->format('Y-m-d'),
            'projects_count' => count($ids),
            'my_tasks_by_status' => $byStatus,
            'overdue' => $overdue->map(fn ($t) => $this->taskRow($t))->all(),
            'due_next_7_days' => $upcoming->map(fn ($t) => $this->taskRow($t))->all(),
            'wallet' => ['available_fcfa' => $wallet['available'], 'awaiting_validation_fcfa' => $wallet['awaiting_validation']],
        ];
    }

    private function listProjects(array $in): array
    {
        $q = Project::whereIn('id', $this->visibleProjectIds())->withCount(['tasks', 'users']);
        if (!empty($in['search'])) {
            $q->where('name', 'like', '%' . $in['search'] . '%');
        }
        return [
            'projects' => $q->orderBy('name')->limit(30)->get()->map(fn ($p) => [
                'id' => $p->id, 'name' => $p->name, 'status' => $p->status,
                'my_role' => $this->myRole($p->id) ?? ($this->isAdmin() ? 'admin' : null),
                'members' => $p->users_count, 'tasks' => $p->tasks_count, 'url' => "/projects/{$p->id}",
                'link' => $this->mdLink($p->name, "/projects/{$p->id}"),
            ])->all(),
        ];
    }

    private function getProject(array $in): array
    {
        $id = (int) ($in['project_id'] ?? 0);
        if (!in_array($id, $this->visibleProjectIds(), true)) {
            return ['error' => "Projet introuvable ou inaccessible."];
        }
        $p = Project::with(['users', 'sprints'])->find($id);
        $today = now();
        return [
            'id' => $p->id, 'name' => $p->name, 'status' => $p->status,
            'description' => $this->clip($p->description, 800),
            'my_role' => $this->myRole($id) ?? ($this->isAdmin() ? 'admin' : null),
            'members' => $p->users->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'role' => $u->pivot->role, 'muted' => (bool) $u->pivot->is_muted, 'link' => $this->mdLink($u->name, "/users/{$u->id}")])->all(),
            'sprints' => $p->sprints->sortByDesc('start_date')->take(8)->map(fn ($s) => [
                'id' => $s->id, 'name' => $s->name, 'start' => (string) $s->start_date, 'end' => (string) $s->end_date,
                'current' => Carbon::parse($s->start_date)->lte($today) && Carbon::parse($s->end_date)->gte($today),
            ])->values()->all(),
            'tasks_by_status' => Task::where('project_id', $id)->select('status', DB::raw('count(*) c'))->groupBy('status')->pluck('c', 'status'),
            'url' => "/projects/{$id}",
            'link' => $this->mdLink($p->name, "/projects/{$id}"),
            'members_page' => $this->mdLink('Gérer les membres', "/project-users/{$id}"),
        ];
    }

    private function listTasks(array $in): array
    {
        $q = Task::with(['project:id,name', 'assignedUser:id,name'])->whereIn('project_id', $this->visibleProjectIds());

        if (!empty($in['project_id'])) { $q->where('project_id', (int) $in['project_id']); }
        if (!empty($in['status'])) { $q->where('status', $in['status']); }
        if (!empty($in['priority'])) { $q->where('priority', $in['priority']); }
        if (isset($in['assignee'])) {
            $q->where('assigned_to', $in['assignee'] === 'me' ? $this->user->id : (int) $in['assignee']);
        }
        if (!empty($in['overdue'])) {
            $q->where('status', '!=', 'done')->whereNotNull('due_date')->where('due_date', '<', now());
        }
        if (!empty($in['due_within_days'])) {
            $q->where('status', '!=', 'done')->whereBetween('due_date', [now(), now()->addDays((int) $in['due_within_days'])]);
        }
        if (!empty($in['search'])) { $q->where('title', 'like', '%' . $in['search'] . '%'); }

        $limit = max(1, min(30, (int) ($in['limit'] ?? 15)));
        $total = (clone $q)->count();
        $rows = $q->orderByRaw('due_date IS NULL')->orderBy('due_date')->limit($limit)->get();

        return ['total' => $total, 'shown' => $rows->count(), 'tasks' => $rows->map(fn ($t) => $this->taskRow($t))->all()];
    }

    private function getTask(array $in): array
    {
        $task = Task::with(['project:id,name', 'assignedUser:id,name', 'sprint:id,name'])->find((int) ($in['task_id'] ?? 0));
        if (!$task || !$this->user->can('view', $task)) {
            return ['error' => 'Tâche introuvable ou inaccessible.'];
        }
        $comments = TaskComment::with('user:id,name')->where('task_id', $task->id)->latest('id')->limit(5)->get()->reverse()->values();

        return $this->taskRow($task) + [
            'description' => $this->clip($task->description, 1200),
            'sprint' => $task->sprint ? ['id' => $task->sprint->id, 'name' => $task->sprint->name] : null,
            'is_paid' => (bool) $task->is_paid,
            'payment_status' => $task->payment_status,
            'recent_comments' => $comments->map(fn ($c) => ['author' => $c->user?->name, 'content' => $this->clip($c->content, 300), 'at' => $c->created_at?->format('Y-m-d H:i')])->all(),
            'can_edit' => $this->user->can('update', $task),
        ];
    }

    private function listSprints(array $in): array
    {
        $id = (int) ($in['project_id'] ?? 0);
        if (!in_array($id, $this->visibleProjectIds(), true)) {
            return ['error' => 'Projet introuvable ou inaccessible.'];
        }
        $today = now();
        return ['sprints' => Sprint::where('project_id', $id)->orderByDesc('start_date')->limit(10)->get()->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'start' => (string) $s->start_date, 'end' => (string) $s->end_date,
            'current' => Carbon::parse($s->start_date)->lte($today) && Carbon::parse($s->end_date)->gte($today),
        ])->all()];
    }

    private function searchUsers(array $in): array
    {
        $term = trim((string) ($in['query'] ?? ''));
        if ($term === '') {
            return ['users' => []];
        }
        $q = User::query()->select('id', 'name', 'job_title')->where('name', 'like', "%{$term}%");
        if (!$this->isAdmin()) {
            $ids = $this->visibleProjectIds();
            $q->whereHas('projects', fn ($p) => $p->whereIn('projects.id', $ids));
        }
        return ['users' => $q->limit(10)->get()->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'job_title' => $u->job_title, 'link' => $this->mdLink($u->name, "/users/{$u->id}")])->all()];
    }

    private function listFiles(array $in): array
    {
        $query = File::query()
            ->with(['project:id,name', 'task:id,title,project_id'])
            ->where(function ($scope) {
                $scope->whereIn('project_id', $this->visibleProjectIds())
                    ->orWhere('user_id', $this->user->id);
            });
        if (!empty($in['project_id'])) {
            if (!in_array((int) $in['project_id'], $this->visibleProjectIds(), true)) {
                return ['error' => 'Projet introuvable ou inaccessible.'];
            }
            $query->where('project_id', (int) $in['project_id']);
        }
        if (!empty($in['search'])) {
            $term = mb_substr(trim((string) $in['search']), 0, 100);
            $query->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%"));
        }

        $files = $query->latest('updated_at')->limit(100)->get()
            ->filter(fn (File $file) => Gate::forUser($this->user)->allows('view', $file)
                && $file->isUnlockedForUser($this->user))
            ->take(30)
            ->values();

        return ['files' => $files->map(fn (File $file) => [
            'file_id' => $file->id,
            'name' => $file->name,
            'type' => $file->type,
            'description' => $this->clip($file->description, 250),
            'project' => $file->project?->name,
            'task' => $file->task ? ['id' => $file->task->id, 'title' => $file->task->title] : null,
            'readable_text' => $this->isReadableTextFile($file),
            'url' => "/files/{$file->id}/edit-content",
        ])->all()];
    }

    private function readFile(array $in): array
    {
        $file = File::with(['project:id,name', 'task:id,title,project_id'])->find((int) ($in['file_id'] ?? 0));
        if (!$file || !Gate::forUser($this->user)->allows('view', $file)) {
            return ['error' => 'Fichier introuvable ou inaccessible.'];
        }
        if (!$file->isUnlockedForUser($this->user)) {
            return ['error' => 'Ce fichier est protégé par mot de passe et doit être déverrouillé dans ProJA avant lecture.'];
        }
        if (!$this->isReadableTextFile($file)) {
            return ['error' => 'Ce format ne peut pas être lu comme texte par l’assistant.'];
        }
        if ((int) $file->size > 1_000_000) {
            return ['error' => 'Ce fichier est trop volumineux pour être transmis à l’assistant.'];
        }

        $path = $this->safeStoragePath($file->file_path);
        if (!$path || !Storage::disk('public')->exists($path)) {
            return ['error' => 'Le contenu du fichier est indisponible.'];
        }
        $content = Storage::disk('public')->get($path);
        if (!is_string($content)) {
            return ['error' => 'Le contenu du fichier est illisible.'];
        }
        $max = 12000;

        return [
            'file_id' => $file->id,
            'name' => $file->name,
            'project' => $file->project?->name,
            'content' => mb_substr($content, 0, $max),
            'truncated' => mb_strlen($content) > $max,
        ];
    }

    private function appendTaskTracking(array $in): array
    {
        $task = Task::with('project:id,name')->find((int) ($in['task_id'] ?? 0));
        $entry = trim((string) ($in['entry'] ?? ''));
        if (!$task || !$this->user->can('view', $task)) {
            return $this->wrap(['error' => 'Tâche introuvable ou inaccessible.']);
        }
        if ($entry === '' || mb_strlen($entry) > 3000) {
            return $this->wrap(['error' => 'La note doit contenir entre 1 et 3000 caractères.']);
        }

        $trackingFile = File::where('task_id', $task->id)
            ->where(function ($query) {
                $query->where('type', 'text/html')->orWhere('name', 'like', '%suivi%');
            })
            ->latest('updated_at')
            ->first();
        if (!$trackingFile || !Gate::forUser($this->user)->allows('update_colab', $trackingFile)) {
            return $this->wrap(['error' => "Vous n'avez pas le droit de modifier le fichier de suivi de cette tâche."]);
        }
        if (!$trackingFile->isUnlockedForUser($this->user) || !$this->isReadableTextFile($trackingFile)) {
            return $this->wrap(['error' => 'Le fichier de suivi est verrouillé ou son format ne permet pas une modification sûre.']);
        }
        if ((int) $trackingFile->size > 2_000_000) {
            return $this->wrap(['error' => 'Le fichier de suivi est trop volumineux pour une modification sûre.']);
        }

        $path = $this->safeStoragePath($trackingFile->file_path);
        if (!$path || !Storage::disk('public')->exists($path)) {
            return $this->wrap(['error' => 'Le fichier de suivi est introuvable sur le stockage.']);
        }
        $existing = Storage::disk('public')->get($path);
        if (!is_string($existing)) {
            return $this->wrap(['error' => 'Le fichier de suivi est illisible.']);
        }
        $timestamp = now()->locale('fr')->translatedFormat('d F Y à H:i');
        $safeEntry = $this->markdownToSafeHtml($entry);
        $updated = $existing . "\n<hr><section><h2>🤖 Note ajoutée par l’assistant — " . e($timestamp) . "</h2><p><em>À la demande de " . e($this->user->name) . "</em></p>{$safeEntry}</section>\n";

        $outcome = $this->invoke(FileController::class, 'updateContent', 'PUT', [
            'content' => $updated,
            'summary' => 'Note ajoutée au suivi par l’assistant IA',
        ], [$trackingFile]);
        if (!$outcome['ok']) {
            return $this->wrap(['error' => $outcome['message']]);
        }

        // L'éditeur collaboratif charge `yjs_state` en priorité : sans cette remise à zéro, la note resterait invisible
        // (et pourrait être écrasée par la prochaine sauvegarde automatique). Il repartira du HTML à jour.
        File::whereKey($trackingFile->id)->update(['yjs_state' => null]);
        try {
            broadcast(new \App\Events\FileContentUpdated($trackingFile->id, $this->user->id, 'assistant'));
        } catch (\Throwable $e) {
            Log::info('AI tracking broadcast skipped', ['error' => $e->getMessage()]);
        }

        return $this->wrap(
            ['updated' => true, 'file_id' => $trackingFile->id, 'task_id' => $task->id, 'link' => $this->mdLink('Fichier de suivi', "/files/{$trackingFile->id}/edit-content")],
            ['type' => 'task_updated', 'label' => 'Suivi : ' . $task->title, 'url' => "/files/{$trackingFile->id}/edit-content"]
        );
    }

    private function isReadableTextFile(File $file): bool
    {
        $extension = strtolower(pathinfo($file->name, PATHINFO_EXTENSION));
        return in_array($extension, ['txt', 'md', 'html', 'css', 'js', 'json', 'xml', 'php', 'csv', 'log'], true)
            || in_array(strtolower((string) $file->type), ['text/plain', 'text/html', 'text/css', 'text/csv', 'application/json', 'application/javascript', 'application/xml'], true);
    }

    private function safeStoragePath(?string $path): ?string
    {
        $path = str_replace('\\', '/', trim((string) $path));
        $path = preg_replace('#^/?public/#', '', $path);
        if ($path === '' || str_contains($path, "\0") || preg_match('#(^|/)\.\.?(/|$)#', $path)
            || str_starts_with($path, '/') || str_starts_with($path, '//') || preg_match('/^[a-z]:/i', $path)) {
            return null;
        }

        return $path;
    }

    // ───────────────────────── Écriture (via les contrôleurs de l'interface) ─────────────────────────

    /** Appelle une méthode de contrôleur comme le ferait l'interface, sous l'identité de l'utilisateur. */
    private function invoke(string $controller, string $method, string $verb, array $payload, array $args = []): array
    {
        $request = Request::create('/', $verb, [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], json_encode($payload));
        $request->setUserResolver(fn () => $this->user);
        if (app()->bound('session.store')) {
            $request->setLaravelSession(app('session.store'));
        }

        $previousUser = Auth::user();
        $previousRequest = app('request');
        Auth::setUser($this->user);
        app()->instance('request', $request);

        try {
            $response = app($controller)->$method($request, ...$args);
        } catch (ValidationException $e) {
            return ['ok' => false, 'message' => 'Données refusées : ' . collect($e->errors())->flatten()->implode(' ')];
        } catch (AuthorizationException $e) {
            return ['ok' => false, 'message' => "Vous n'avez pas le droit d'effectuer cette action."];
        } finally {
            app()->instance('request', $previousRequest);
            if ($previousUser) { Auth::setUser($previousUser); }
            // Les redirections avec message « flash » ne doivent pas réapparaître sur la prochaine page
            session()->forget(['success', 'error', 'message']);
        }

        $status = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;
        if ($status === 403) {
            return ['ok' => false, 'message' => "Vous n'avez pas le droit d'effectuer cette action."];
        }
        if ($status >= 400) {
            $body = method_exists($response, 'getData') ? (array) $response->getData(true) : [];
            return ['ok' => false, 'message' => $body['message'] ?? "L'opération a été refusée (code {$status})."];
        }
        return ['ok' => true];
    }

    private function createTask(array $in): array
    {
        $projectId = (int) ($in['project_id'] ?? 0);
        if (!in_array($projectId, $this->managerProjectIds(), true)) {
            return $this->wrap(['error' => "Seuls les managers du projet (ou les admins) peuvent créer des tâches. Votre rôle ne le permet pas."]);
        }
        $title = trim((string) ($in['title'] ?? ''));
        if ($title === '') {
            return $this->wrap(['error' => 'Le titre est obligatoire.']);
        }

        // Sprint : celui demandé, sinon le sprint en cours, sinon le dernier
        $sprintId = (int) ($in['sprint_id'] ?? 0);
        if ($sprintId && !Sprint::where('id', $sprintId)->where('project_id', $projectId)->exists()) {
            return $this->wrap(['error' => "Ce sprint n'appartient pas au projet."]);
        }
        if (!$sprintId) {
            $now = now();
            $sprint = Sprint::where('project_id', $projectId)->where('start_date', '<=', $now)->where('end_date', '>=', $now)->first()
                ?? Sprint::where('project_id', $projectId)->orderByDesc('end_date')->first();
            if (!$sprint) {
                return $this->wrap(['error' => "Ce projet n'a aucun sprint : créez d'abord un sprint."]);
            }
            $sprintId = $sprint->id;
        }

        $assignee = $in['assigned_to'] ?? null;
        if ($assignee && !DB::table('project_user')->where('project_id', $projectId)->where('user_id', (int) $assignee)->exists()) {
            return $this->wrap(['error' => "Cette personne n'est pas membre du projet."]);
        }

        $payload = [
            'title' => mb_substr($title, 0, 255),
            'description' => $in['description'] ?? null,
            'status' => $in['status'] ?? 'todo',
            'priority' => $in['priority'] ?? 'medium',
            'due_date' => $this->parseDate($in['due_date'] ?? null),
            'project_id' => $projectId,
            'sprint_id' => $sprintId,
            'assigned_to' => $assignee ? (int) $assignee : null,
            'is_paid' => false,
            'payment_reason' => Task::REASON_OTHER, // montants / paiements : jamais gérés par l'IA
        ];

        $outcome = $this->invoke(TaskController::class, 'store', 'POST', $payload);
        if (!$outcome['ok']) {
            return $this->wrap(['error' => $outcome['message']]);
        }

        $task = Task::where('project_id', $projectId)->where('created_by', $this->user->id)->where('title', $payload['title'])->latest('id')->first();
        if (!$task) {
            return $this->wrap(['error' => "La tâche semble créée mais je n'ai pas pu la retrouver."]);
        }

        return $this->wrap(
            ['created' => true, 'task' => $this->taskRow($task->load(['project:id,name', 'assignedUser:id,name']))],
            ['type' => 'task_created', 'label' => $task->title, 'url' => "/tasks/{$task->id}"]
        );
    }

    private function updateTask(array $in): array
    {
        $task = Task::find((int) ($in['task_id'] ?? 0));
        if (!$task || !$this->user->can('update', $task)) {
            return $this->wrap(['error' => "Tâche introuvable, ou vous n'avez pas le droit de la modifier (réservé aux managers du projet)."]);
        }

        if (array_key_exists('assigned_to', $in) && $in['assigned_to']
            && !DB::table('project_user')->where('project_id', $task->project_id)->where('user_id', (int) $in['assigned_to'])->exists()) {
            return $this->wrap(['error' => "Cette personne n'est pas membre du projet."]);
        }
        if (!empty($in['sprint_id']) && !Sprint::where('id', (int) $in['sprint_id'])->where('project_id', $task->project_id)->exists()) {
            return $this->wrap(['error' => "Ce sprint n'appartient pas au projet de la tâche."]);
        }

        // Le contrôleur exige tous les champs : on repart des valeurs actuelles et on applique uniquement les changements demandés
        $payload = [
            'title' => $in['title'] ?? $task->title,
            'description' => array_key_exists('description', $in) ? $in['description'] : $task->description,
            'status' => $in['status'] ?? $task->status,
            'priority' => $in['priority'] ?? $task->priority,
            'due_date' => array_key_exists('due_date', $in) ? $this->parseDate($in['due_date']) : $task->due_date?->format('Y-m-d H:i:s'),
            'project_id' => $task->project_id,
            'sprint_id' => !empty($in['sprint_id']) ? (int) $in['sprint_id'] : $task->sprint_id,
            'assigned_to' => array_key_exists('assigned_to', $in) ? ($in['assigned_to'] ? (int) $in['assigned_to'] : null) : $task->assigned_to,
            // Champs financiers conservés tels quels
            'is_paid' => (bool) $task->is_paid,
            'payment_reason' => $task->payment_reason ?: Task::REASON_OTHER,
            'amount' => $task->amount,
            'payment_status' => $task->payment_status ?: Task::PAYMENT_STATUS_UNPAID,
        ];

        $outcome = $this->invoke(TaskController::class, 'update', 'PUT', $payload, [$task]);
        if (!$outcome['ok']) {
            return $this->wrap(['error' => $outcome['message']]);
        }

        $task->refresh()->load(['project:id,name', 'assignedUser:id,name']);
        return $this->wrap(
            ['updated' => true, 'task' => $this->taskRow($task)],
            ['type' => 'task_updated', 'label' => $task->title, 'url' => "/tasks/{$task->id}"]
        );
    }

    private function addComment(array $in): array
    {
        $task = Task::find((int) ($in['task_id'] ?? 0));
        $content = trim((string) ($in['content'] ?? ''));
        if (!$task || !$this->user->can('comment', $task)) {
            return $this->wrap(['error' => "Tâche introuvable, ou vous ne pouvez pas y commenter."]);
        }
        if ($content === '') {
            return $this->wrap(['error' => 'Le commentaire est vide.']);
        }

        $outcome = $this->invoke(TaskCommentController::class, 'store', 'POST', ['content' => mb_substr($content, 0, 2000)], [$task->id]);
        if (!$outcome['ok']) {
            return $this->wrap(['error' => $outcome['message']]);
        }
        return $this->wrap(['commented' => true], ['type' => 'comment_added', 'label' => $task->title, 'url' => "/tasks/{$task->id}/discussion"]);
    }

    // ───────────────────────── Suppression (confirmation obligatoire) ─────────────────────────

    private function requestDeleteTask(array $in, ?int $conversationId): array
    {
        $task = Task::find((int) ($in['task_id'] ?? 0));
        if (!$task || !$this->user->can('delete', $task)) {
            return $this->wrap(['error' => "Tâche introuvable, ou vous n'avez pas le droit de la supprimer."]);
        }

        $pending = AiPendingAction::create([
            'user_id' => $this->user->id,
            'conversation_id' => $conversationId,
            'tool' => 'delete_task',
            'input' => ['task_id' => $task->id],
            'summary' => "Supprimer la tâche « {$task->title} »",
            'expires_at' => now()->addMinutes(15),
        ]);

        return [
            'result' => ['status' => 'awaiting_user_confirmation', 'note' => "Rien n'est supprimé. L'utilisateur doit cliquer sur « Confirmer » (valable 15 minutes)."],
            'action' => ['type' => 'confirm', 'pending_id' => $pending->id, 'label' => $pending->summary],
        ];
    }

 public function deleteTask(int $taskId): array
{
    $task = Task::find($taskId);

    if (!$task || !$this->user->can('delete', $task)) {
        return [
            'ok' => false,
            'message' => "Tâche introuvable ou suppression non autorisée.",
        ];
    }

    $title = $task->title;

    $previousUser = Auth::user();
    $previousRequest = app('request');

    Auth::setUser($this->user);

    try {
        /*
         * TaskController::destroy() attend directement un Task :
         * destroy(Task $task)
         */
        $response = app(TaskController::class)->destroy($task);

    } catch (ValidationException $e) {
        return [
            'ok' => false,
            'message' => 'Suppression refusée : ' .
                collect($e->errors())->flatten()->implode(' '),
        ];

    } catch (AuthorizationException $e) {
        return [
            'ok' => false,
            'message' => "Vous n'avez pas le droit de supprimer cette tâche.",
        ];

    } catch (\Throwable $e) {
        Log::error('AI: erreur suppression tâche confirmée', [
            'task_id' => $taskId,
            'user_id' => $this->user->id,
            'error' => $e->getMessage(),
        ]);

        return [
            'ok' => false,
            'message' => "La suppression de la tâche a échoué.",
        ];

    } finally {
        app()->instance('request', $previousRequest);
        Auth::setUser($previousUser);

        session()->forget([
            'success',
            'error',
            'message',
        ]);
    }

    $status = method_exists($response, 'getStatusCode')
        ? $response->getStatusCode()
        : 200;

    if ($status === 403) {
        return [
            'ok' => false,
            'message' => "Vous n'avez pas le droit de supprimer cette tâche.",
        ];
    }

    if ($status >= 400) {
        $body = method_exists($response, 'getData')
            ? (array) $response->getData(true)
            : [];

        return [
            'ok' => false,
            'message' => $body['message']
                ?? "La suppression a été refusée (code {$status}).",
        ];
    }

    return [
        'ok' => true,
        'message' => "Tâche « {$title} » supprimée.",
    ];
}

    // ───────────────────────── Navigation ─────────────────────────

    private function openPage(array $in): array
    {
        $path = '/' . ltrim((string) ($in['path'] ?? ''), '/');
        $ok = !str_contains($path, '//') && !str_contains($path, '..') && collect(self::LINK_PREFIXES)->contains(fn ($p) => $path === $p || str_starts_with($path, $p . '/') || str_starts_with($path, $p . '?'));
        if (!$ok) {
            return $this->wrap(['error' => "Cette page n'est pas disponible comme lien."]);
        }
        return $this->wrap(['link_ready' => true], ['type' => 'link', 'label' => $in['label'] ?? 'Ouvrir la page', 'url' => $path]);
    }
}
