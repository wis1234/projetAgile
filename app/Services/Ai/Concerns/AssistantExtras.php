<?php

namespace App\Services\Ai\Concerns;

use App\Models\AiPendingAction;
use App\Models\File;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Services\Ai\FileTextExtractor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * Outils « avancés » de l'assistant : liens, fichiers (lecture complète + recherche dans le contenu),
 * gestion des membres d'un projet, rapports d'activité.
 * Utilise les aides privées de AssistantTools (visibleProjectIds, managerProjectIds, wrap, clip, isAdmin…).
 */
trait AssistantExtras
{
    private const MEMBER_ROLES = ['member', 'manager', 'observer'];

    private function feature(string $name): bool
    {
        return (bool) ($this->features[$name] ?? true);
    }

    private function disabled(string $what): array
    {
        return ['error' => "{$what} est désactivé par un administrateur de ProJA."];
    }

    /** Lien Markdown prêt à coller dans la réponse (les crochets du titre sont neutralisés). */
    private function mdLink(string $label, string $url): string
    {
        $label = trim(str_replace(['[', ']', '(', ')', "\n", "\r"], ' ', $label)) ?: 'Ouvrir';
        return "[{$label}]({$url})";
    }

    /** Texte / Markdown léger du modèle → HTML sûr (tout est échappé AVANT la mise en forme). */
    private function markdownToSafeHtml(string $text): string
    {
        $inline = function (string $s): string {
            $s = e($s);
            $s = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $s);
            return preg_replace('/`([^`]+)`/', '<code>$1</code>', $s);
        };
        $html = '';
        $list = null;
        $close = function () use (&$html, &$list) {
            if ($list) { $html .= "</{$list}>"; $list = null; }
        };
        foreach (preg_split('/\R/', trim($text)) as $line) {
            $line = rtrim($line);
            if (preg_match('/^\s*[-*•]\s+\[( |x|X)\]\s+(.*)$/', $line, $m)) {
                if ($list !== 'ul') { $close(); $html .= '<ul>'; $list = 'ul'; }
                $html .= '<li>' . (strtolower($m[1]) === 'x' ? '☑ ' : '☐ ') . $inline($m[2]) . '</li>';
            } elseif (preg_match('/^\s*[-*•]\s+(.*)$/', $line, $m)) {
                if ($list !== 'ul') { $close(); $html .= '<ul>'; $list = 'ul'; }
                $html .= '<li>' . $inline($m[1]) . '</li>';
            } elseif (preg_match('/^\s*\d+[.)]\s+(.*)$/', $line, $m)) {
                if ($list !== 'ol') { $close(); $html .= '<ol>'; $list = 'ol'; }
                $html .= '<li>' . $inline($m[1]) . '</li>';
            } elseif (trim($line) === '') {
                $close();
            } else {
                $close();
                $html .= '<p>' . $inline($line) . '</p>';
            }
        }
        $close();
        return $html;
    }

    // ───────────────────────── Définitions ─────────────────────────

    public static function extraDefinitions(array $features): array
    {
        $int = ['type' => 'integer'];
        $str = ['type' => 'string'];
        $defs = [];

        if ($features['files_read'] ?? true) {
            $defs[] = [
                'name' => 'list_files',
                'description' => "Liste les documents ProJA accessibles à l'utilisateur (filtres : projet, tâche, nom). Chaque fichier a un « link » Markdown à reprendre tel quel dans la réponse. À utiliser avant read_file.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int, 'task_id' => $int, 'search' => $str,
                    'tracking_only' => ['type' => 'boolean', 'description' => 'Uniquement les fichiers de suivi de tâche'],
                ]],
            ];
            $defs[] = [
                'name' => 'read_file',
                'description' => "Lit le contenu texte d'un document (HTML, Word, PowerPoint, Excel, PDF, texte). Pagination : si next_offset n'est pas nul, rappeler avec offset=next_offset pour lire la suite. Utiliser un file_id obtenu avec list_files.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'file_id' => $int,
                    'offset' => ['type' => 'integer', 'description' => 'Caractère de départ (défaut 0)'],
                    'max_chars' => ['type' => 'integer', 'description' => 'Taille de la page, 2000 à 16000 (défaut 12000)'],
                ], 'required' => ['file_id']],
            ];
            $defs[] = [
                'name' => 'search_files_content',
                'description' => "Cherche un mot ou une expression DANS le contenu des documents accessibles (pas seulement leur nom) et renvoie des extraits avec le lien du fichier.",
                'input_schema' => ['type' => 'object', 'properties' => ['query' => $str, 'project_id' => $int], 'required' => ['query']],
            ];
        }

        if ($features['members'] ?? true) {
            $defs[] = [
                'name' => 'add_project_member',
                'description' => "Ajoute une personne à un projet (réservé aux managers du projet et aux admins). Rôles : member, manager, observer. La personne et l'équipe sont notifiées. Retrouver user_id avec search_users.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int, 'user_id' => $int,
                    'role' => ['type' => 'string', 'enum' => self::MEMBER_ROLES],
                ], 'required' => ['project_id', 'user_id']],
            ];
            $defs[] = [
                'name' => 'change_member_role',
                'description' => "Change le rôle d'un membre dans un projet (réservé aux managers du projet et aux admins). Le dernier manager ne peut pas être rétrogradé.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int, 'user_id' => $int,
                    'role' => ['type' => 'string', 'enum' => self::MEMBER_ROLES],
                ], 'required' => ['project_id', 'user_id', 'role']],
            ];
            $defs[] = [
                'name' => 'remove_project_member',
                'description' => "Demande le retrait d'un membre d'un projet. Rien n'est retiré tant que l'utilisateur n'a pas cliqué sur « Confirmer » : après l'appel, dis-lui simplement de confirmer. unassign_open_tasks=true désassigne aussi ses tâches non terminées dans ce projet.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'project_id' => $int, 'user_id' => $int,
                    'unassign_open_tasks' => ['type' => 'boolean'],
                ], 'required' => ['project_id', 'user_id']],
            ];
        }

        if ($features['reports'] ?? true) {
            $defs[] = [
                'name' => 'generate_report',
                'description' => "Produit les chiffres d'un rapport d'activité (tâches créées/terminées/en retard, charge par membre, commentaires, fichiers, risques, temps forts) pour un projet, une personne ou toute l'équipe, sur une période. Rédige ensuite le rapport à partir de ces données, sans rien inventer.",
                'input_schema' => ['type' => 'object', 'properties' => [
                    'scope' => ['type' => 'string', 'enum' => ['team', 'project', 'user'], 'description' => "team = tous les projets de l'utilisateur"],
                    'project_id' => $int,
                    'user_id' => ['type' => 'string', 'description' => "Identifiant d'un membre, ou 'me' pour l'utilisateur lui-même"],
                    'period' => ['type' => 'string', 'enum' => ['today', 'last_7_days', 'week', 'last_week', 'last_30_days', 'month', 'last_month', 'quarter', 'custom']],
                    'from' => ['type' => 'string', 'description' => 'AAAA-MM-JJ (period=custom)'],
                    'to' => ['type' => 'string', 'description' => 'AAAA-MM-JJ (period=custom)'],
                ]],
            ];
        }

        return $defs;
    }

    // ───────────────────────── Fichiers ─────────────────────────

    private function fileLink(File $f): string
    {
        return $this->mdLink($f->name, "/files/{$f->id}");
    }

    private function isTrackingFile(File $f): bool
    {
        return $f->task_id && ($f->type === 'text/html' || stripos((string) $f->name, 'suivi') !== false);
    }

    private function listFilesSmart(array $in): array
    {
        if (!$this->feature('files_read')) {
            return $this->disabled('La lecture des fichiers par l\'assistant');
        }

        $query = File::query()->with(['project:id,name', 'task:id,title,project_id'])
            ->where(fn ($q) => $q->whereIn('project_id', $this->visibleProjectIds())->orWhere('user_id', $this->user->id));

        if (!empty($in['project_id'])) {
            if (!in_array((int) $in['project_id'], $this->visibleProjectIds(), true)) {
                return ['error' => 'Projet introuvable ou inaccessible.'];
            }
            $query->where('project_id', (int) $in['project_id']);
        }
        if (!empty($in['task_id'])) {
            $query->where('task_id', (int) $in['task_id']);
        }
        if (!empty($in['tracking_only'])) {
            $query->whereNotNull('task_id')->where(fn ($q) => $q->where('type', 'text/html')->orWhere('name', 'like', '%suivi%'));
        }
        if (!empty($in['search'])) {
            $term = mb_substr(trim((string) $in['search']), 0, 100);
            $query->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('description', 'like', "%{$term}%"));
        }

        $files = $query->latest('updated_at')->limit(120)->get()
            ->filter(fn (File $f) => Gate::forUser($this->user)->allows('view', $f) && $f->isUnlockedForUser($this->user))
            ->take(30)->values();

        return ['count' => $files->count(), 'files' => $files->map(fn (File $f) => [
            'file_id' => $f->id,
            'name' => $f->name,
            'link' => $this->fileLink($f),
            'type' => $f->type,
            'tracking_file' => $this->isTrackingFile($f),
            'description' => $this->clip($f->description, 200),
            'project' => $f->project ? ['name' => $f->project->name, 'link' => $this->mdLink($f->project->name, "/projects/{$f->project->id}")] : null,
            'task' => $f->task ? ['id' => $f->task->id, 'title' => $f->task->title, 'link' => $this->mdLink($f->task->title, "/tasks/{$f->task->id}")] : null,
            'readable' => FileTextExtractor::supports($f),
            'updated_at' => $f->updated_at?->format('Y-m-d H:i'),
        ])->all()];
    }

    private function readFileSmart(array $in): array
    {
        if (!$this->feature('files_read')) {
            return $this->disabled('La lecture des fichiers par l\'assistant');
        }
        $file = File::with(['project:id,name', 'task:id,title'])->find((int) ($in['file_id'] ?? 0));
        if (!$file || !Gate::forUser($this->user)->allows('view', $file)) {
            return ['error' => 'Fichier introuvable ou inaccessible.'];
        }
        if (!$file->isUnlockedForUser($this->user)) {
            return ['error' => 'Ce fichier est protégé par mot de passe : il doit être déverrouillé dans ProJA avant lecture.'];
        }

        $extracted = app(FileTextExtractor::class)->extract($file);
        if ($extracted['text'] === null) {
            return ['error' => $extracted['error'] ?: 'Ce fichier ne peut pas être lu comme du texte.', 'link' => $this->fileLink($file)];
        }

        $text = $extracted['text'];
        $total = mb_strlen($text);
        $offset = max(0, min($total, (int) ($in['offset'] ?? 0)));
        $size = max(2000, min(16000, (int) ($in['max_chars'] ?? 12000)));
        $slice = mb_substr($text, $offset, $size);
        $end = $offset + mb_strlen($slice);

        return [
            'file_id' => $file->id,
            'name' => $file->name,
            'link' => $this->fileLink($file),
            'project' => $file->project?->name,
            'task' => $file->task ? ['title' => $file->task->title, 'link' => $this->mdLink($file->task->title, "/tasks/{$file->task->id}")] : null,
            'total_chars' => $total,
            'offset' => $offset,
            'next_offset' => $end < $total ? $end : null,
            'content' => $slice,
        ];
    }

    private function searchFilesContent(array $in): array
    {
        if (!$this->feature('files_read')) {
            return $this->disabled('La lecture des fichiers par l\'assistant');
        }
        $needle = trim((string) ($in['query'] ?? ''));
        if (mb_strlen($needle) < 2) {
            return ['error' => 'Donnez au moins 2 caractères à chercher.'];
        }

        $q = File::query()->with(['project:id,name'])
            ->where(fn ($w) => $w->whereIn('project_id', $this->visibleProjectIds())->orWhere('user_id', $this->user->id))
            ->where('size', '<=', 2_000_000);
        if (!empty($in['project_id'])) {
            if (!in_array((int) $in['project_id'], $this->visibleProjectIds(), true)) {
                return ['error' => 'Projet introuvable ou inaccessible.'];
            }
            $q->where('project_id', (int) $in['project_id']);
        }

        $extractor = app(FileTextExtractor::class);
        $started = microtime(true);
        $hits = [];
        $scanned = 0;
        foreach ($q->latest('updated_at')->limit(80)->get() as $file) {
            if (microtime(true) - $started > 8 || count($hits) >= 10) {
                break; // budget de temps : on renvoie ce qu'on a déjà
            }
            if (!FileTextExtractor::supports($file) || !Gate::forUser($this->user)->allows('view', $file) || !$file->isUnlockedForUser($this->user)) {
                continue;
            }
            $scanned++;
            $text = $extractor->extract($file)['text'] ?? null;
            if (!$text) {
                continue;
            }
            $pos = mb_stripos($text, $needle);
            if ($pos === false) {
                continue;
            }
            $snippets = [];
            $from = 0;
            while (count($snippets) < 3 && ($p = mb_stripos($text, $needle, $from)) !== false) {
                $snippets[] = '…' . trim(preg_replace('/\s+/', ' ', mb_substr($text, max(0, $p - 110), 240))) . '…';
                $from = $p + mb_strlen($needle) + 120;
            }
            $hits[] = ['file_id' => $file->id, 'link' => $this->fileLink($file), 'project' => $file->project?->name, 'snippets' => $snippets];
        }

        return ['query' => $needle, 'files_scanned' => $scanned, 'matches' => $hits];
    }

    // ───────────────────────── Membres ─────────────────────────

    private function resolveProjectForMembers(int $projectId): array
    {
        if (!$this->feature('members')) {
            return [null, $this->disabled('La gestion des membres par l\'assistant')];
        }
        $project = Project::find($projectId);
        if (!$project || !in_array($projectId, $this->visibleProjectIds(), true)) {
            return [null, ['error' => 'Projet introuvable ou inaccessible.']];
        }
        if (!$this->user->can('manageMembers', $project)) {
            return [null, ['error' => "Seuls les managers du projet (ou les admins) peuvent gérer ses membres."]];
        }
        return [$project, null];
    }

    private function activeManagerCount(int $projectId, ?int $excludeUserId = null): int
    {
        return DB::table('project_user')->where('project_id', $projectId)->where('role', 'manager')
            ->when($excludeUserId, fn ($q) => $q->where('user_id', '!=', $excludeUserId))->count();
    }

    private function addProjectMember(array $in): array
    {
        [$project, $err] = $this->resolveProjectForMembers((int) ($in['project_id'] ?? 0));
        if ($err) {
            return $this->wrap($err);
        }
        $role = $in['role'] ?? 'member';
        if (!in_array($role, self::MEMBER_ROLES, true)) {
            return $this->wrap(['error' => 'Rôle invalide. Valeurs possibles : member, manager, observer.']);
        }
        $target = User::find((int) ($in['user_id'] ?? 0));
        if (!$target) {
            return $this->wrap(['error' => "Cette personne n'existe pas. Utilisez search_users pour retrouver son identifiant."]);
        }
        if ($target->id === $this->user->id) {
            return $this->wrap(['error' => 'Vous ne pouvez pas vous ajouter vous-même.']);
        }
        if (DB::table('project_user')->where('project_id', $project->id)->where('user_id', $target->id)->exists()) {
            return $this->wrap(['error' => "{$target->name} est déjà membre de « {$project->name} »."]);
        }

        DB::table('project_user')->insert([
            'project_id' => $project->id, 'user_id' => $target->id, 'role' => $role,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Mêmes notifications que l'interface (échec silencieux : l'ajout lui-même est déjà fait)
        try {
            $target->notify(new \App\Notifications\ProjectNotification('user_added', [
                'project_id' => $project->id, 'project_name' => $project->name,
                'project_url' => route('projects.show', $project->id), 'role' => $role, 'added_by' => $this->user->name,
            ]));
            $project->notifyMembers('user_added_to_project', [
                'user_id' => $target->id, 'user_name' => $target->name, 'user_email' => $target->email,
                'role' => $role, 'added_by' => $this->user->name,
            ]);
        } catch (\Throwable $e) {
            Log::warning('AI add member: notification failed', ['error' => $e->getMessage()]);
        }
        $this->logActivity('create', "{$target->name} ajouté au projet « {$project->name} » (rôle {$role}) via l'assistant IA", $project);

        return $this->wrap(
            ['added' => true, 'member' => ['id' => $target->id, 'name' => $target->name, 'role' => $role, 'link' => $this->mdLink($target->name, "/users/{$target->id}")],
             'project' => ['name' => $project->name, 'link' => $this->mdLink($project->name, "/projects/{$project->id}")]],
            ['type' => 'member_added', 'label' => "{$target->name} → {$project->name}", 'url' => "/project-users/{$project->id}"]
        );
    }

    private function changeMemberRole(array $in): array
    {
        [$project, $err] = $this->resolveProjectForMembers((int) ($in['project_id'] ?? 0));
        if ($err) {
            return $this->wrap($err);
        }
        $role = $in['role'] ?? '';
        if (!in_array($role, self::MEMBER_ROLES, true)) {
            return $this->wrap(['error' => 'Rôle invalide. Valeurs possibles : member, manager, observer.']);
        }
        $uid = (int) ($in['user_id'] ?? 0);
        $current = DB::table('project_user')->where('project_id', $project->id)->where('user_id', $uid)->value('role');
        if ($current === null) {
            return $this->wrap(['error' => "Cette personne n'est pas membre du projet."]);
        }
        if ($current === $role) {
            return $this->wrap(['error' => "Cette personne a déjà le rôle « {$role} »."]);
        }
        if ($current === 'manager' && $role !== 'manager' && $this->activeManagerCount($project->id, $uid) === 0) {
            return $this->wrap(['error' => 'Impossible : ce projet doit garder au moins un manager. Nommez-en un autre d’abord.']);
        }

        DB::table('project_user')->where('project_id', $project->id)->where('user_id', $uid)
            ->update(['role' => $role, 'updated_at' => now()]);
        $name = User::whereKey($uid)->value('name');
        $this->logActivity('update', "Rôle de {$name} changé en {$role} dans « {$project->name} » via l'assistant IA", $project);

        return $this->wrap(['updated' => true, 'member' => $name, 'previous_role' => $current, 'new_role' => $role],
            ['type' => 'member_added', 'label' => "{$name} : {$role}", 'url' => "/project-users/{$project->id}"]);
    }

    private function requestRemoveMember(array $in, ?int $conversationId): array
    {
        [$project, $err] = $this->resolveProjectForMembers((int) ($in['project_id'] ?? 0));
        if ($err) {
            return $this->wrap($err);
        }
        $uid = (int) ($in['user_id'] ?? 0);
        $target = User::find($uid);
        $role = DB::table('project_user')->where('project_id', $project->id)->where('user_id', $uid)->value('role');
        if (!$target || $role === null) {
            return $this->wrap(['error' => "Cette personne n'est pas membre du projet."]);
        }
        if ($uid === $this->user->id) {
            return $this->wrap(['error' => "Vous ne pouvez pas vous retirer vous-même d'un projet via l'assistant."]);
        }
        if ($role === 'manager' && $this->activeManagerCount($project->id, $uid) === 0) {
            return $this->wrap(['error' => 'Impossible : ce projet doit garder au moins un manager.']);
        }

        $openTasks = Task::where('project_id', $project->id)->where('assigned_to', $uid)->where('status', '!=', 'done')->count();
        $unassign = !empty($in['unassign_open_tasks']);
        $summary = "Retirer {$target->name} du projet « {$project->name} »"
            . ($openTasks ? ($unassign ? " (ses {$openTasks} tâche(s) ouverte(s) seront désassignées)" : " ({$openTasks} tâche(s) ouverte(s) resteront assignées à cette personne)") : '');

        $pending = AiPendingAction::create([
            'user_id' => $this->user->id,
            'conversation_id' => $conversationId,
            'tool' => 'remove_project_member',
            'input' => ['project_id' => $project->id, 'user_id' => $uid, 'unassign_open_tasks' => $unassign],
            'summary' => mb_substr($summary, 0, 250),
            'expires_at' => now()->addMinutes(15),
        ]);

        return [
            'result' => ['status' => 'awaiting_user_confirmation', 'open_tasks_assigned' => $openTasks, 'note' => "Rien n'est retiré. L'utilisateur doit cliquer sur « Confirmer » (valable 15 minutes)."],
            'action' => ['type' => 'confirm', 'pending_id' => $pending->id, 'label' => $pending->summary],
        ];
    }

    /** Exécution réelle après confirmation : toutes les vérifications sont refaites (l'état a pu changer). */
    public function removeProjectMember(int $projectId, int $userId, bool $unassign): array
    {
        [$project, $err] = $this->resolveProjectForMembers($projectId);
        if ($err) {
            return ['ok' => false, 'message' => $err['error']];
        }
        $role = DB::table('project_user')->where('project_id', $projectId)->where('user_id', $userId)->value('role');
        if ($role === null) {
            return ['ok' => false, 'message' => "Cette personne n'est plus membre du projet."];
        }
        if ($userId === $this->user->id) {
            return ['ok' => false, 'message' => 'Action refusée.'];
        }
        if ($role === 'manager' && $this->activeManagerCount($projectId, $userId) === 0) {
            return ['ok' => false, 'message' => 'Impossible : ce projet doit garder au moins un manager.'];
        }

        $name = User::whereKey($userId)->value('name') ?? 'Le membre';
        $freed = 0;
        DB::transaction(function () use ($projectId, $userId, $unassign, &$freed) {
            DB::table('project_user')->where('project_id', $projectId)->where('user_id', $userId)->delete();
            if ($unassign) {
                $freed = Task::where('project_id', $projectId)->where('assigned_to', $userId)->where('status', '!=', 'done')->update(['assigned_to' => null]);
            }
        });
        $this->logActivity('delete', "{$name} retiré du projet « {$project->name} » via l'assistant IA", $project);

        return ['ok' => true, 'message' => "{$name} a été retiré du projet « {$project->name} »." . ($freed ? " {$freed} tâche(s) désassignée(s)." : '')];
    }

    private function logActivity(string $type, string $description, $subject): void
    {
        try {
            if (function_exists('activity_log')) {
                activity_log($type, $description, $subject);
            }
        } catch (\Throwable $e) {
            // journal d'activité facultatif
        }
    }

    // ───────────────────────── Rapports ─────────────────────────

    private function reportPeriod(array $in): array
    {
        $now = now();
        $period = $in['period'] ?? 'last_7_days';
        [$from, $to, $label] = match ($period) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), "aujourd'hui"],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfDay(), 'cette semaine'],
            'last_week' => [$now->copy()->subWeek()->startOfWeek(), $now->copy()->subWeek()->endOfWeek(), 'la semaine dernière'],
            'last_30_days' => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay(), 'les 30 derniers jours'],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfDay(), 'ce mois-ci'],
            'last_month' => [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->subMonthNoOverflow()->endOfMonth(), 'le mois dernier'],
            'quarter' => [$now->copy()->startOfQuarter(), $now->copy()->endOfDay(), 'ce trimestre'],
            'custom' => [Carbon::parse($in['from'] ?? $now->copy()->subDays(6))->startOfDay(), Carbon::parse($in['to'] ?? $now)->endOfDay(), 'la période demandée'],
            default => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay(), 'les 7 derniers jours'],
        };
        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }
        if ($from->diffInDays($to) > 366) {
            $from = $to->copy()->subDays(366)->startOfDay();
        }
        return [$from, $to, $label];
    }

    private function generateReport(array $in): array
    {
        if (!$this->feature('reports')) {
            return $this->wrap($this->disabled('Les rapports de l\'assistant'));
        }
        try {
            [$from, $to, $periodLabel] = $this->reportPeriod($in);
        } catch (\Throwable $e) {
            return $this->wrap(['error' => 'Dates invalides (format attendu : AAAA-MM-JJ).']);
        }

        $visible = $this->visibleProjectIds();
        $scope = in_array($in['scope'] ?? 'team', ['team', 'project', 'user'], true) ? ($in['scope'] ?? 'team') : 'team';
        $pids = $visible;
        $target = null;
        $title = 'Rapport de l\'équipe';

        if (!empty($in['project_id']) && $scope !== 'user') {
            $scope = 'project';
        }
        if ($scope === 'project') {
            $pid = (int) ($in['project_id'] ?? 0);
            if (!in_array($pid, $visible, true)) {
                return $this->wrap(['error' => 'Projet introuvable ou inaccessible.']);
            }
            $pids = [$pid];
            $title = 'Rapport du projet « ' . Project::whereKey($pid)->value('name') . ' »';
        } elseif ($scope === 'user') {
            $rawUser = $in['user_id'] ?? 'me';
            $uid = ($rawUser === 'me' || $rawUser === '' || $rawUser === null) ? $this->user->id : (int) $rawUser;
            $target = User::find($uid);
            if (!$target) {
                return $this->wrap(['error' => 'Personne introuvable.']);
            }
            $theirs = DB::table('project_user')->where('user_id', $uid)->pluck('project_id')->all();
            $allowed = $uid === $this->user->id ? $visible : ($this->isAdmin() ? $visible : $this->managerProjectIds());
            $pids = array_values(array_intersect($theirs, $allowed));
            if (!empty($in['project_id'])) {
                $pids = array_values(array_intersect($pids, [(int) $in['project_id']]));
            }
            if (!$pids) {
                return $this->wrap(['error' => $uid === $this->user->id
                    ? "Aucun projet à analyser."
                    : "Vous ne pouvez produire un rapport que sur les membres des projets que vous gérez."]);
            }
            $title = 'Rapport d\'activité de ' . $target->name;
        }
        if (!$pids) {
            return $this->wrap(['error' => "Aucun projet accessible pour établir un rapport."]);
        }

        $nowStr = now()->toDateTimeString();
        $range = [$from->toDateTimeString(), $to->toDateTimeString()];
        $base = fn () => Task::query()->whereIn('project_id', $pids)->when($target, fn ($q) => $q->where('assigned_to', $target->id));

        $total = $base()->count();
        $done = $base()->where('status', 'done')->count();
        $open = $total - $done;
        $overdueCount = $base()->where('status', '!=', 'done')->whereNotNull('due_date')->where('due_date', '<', $nowStr)->count();

        $report = [
            'title' => $title,
            'period' => ['label' => $periodLabel, 'from' => $from->toDateString(), 'to' => $to->toDateString()],
            'generated_at' => now()->format('Y-m-d H:i'),
            'scope' => $scope,
            'projects_analysed' => count($pids),
            'totals' => [
                'tasks' => $total, 'done' => $done, 'open' => $open,
                'completion_rate_pct' => $total ? round($done * 100 / $total) : null,
                'overdue_now' => $overdueCount,
                'due_next_7_days' => $base()->where('status', '!=', 'done')->whereBetween('due_date', [$nowStr, now()->addDays(7)->toDateTimeString()])->count(),
            ],
            'in_period' => [
                'tasks_created' => $base()->whereBetween('created_at', $range)->count(),
                'tasks_completed' => $base()->where('status', 'done')->whereBetween('updated_at', $range)->count(),
            ],
            'open_by_status' => $base()->where('status', '!=', 'done')->select('status', DB::raw('count(*) c'))->groupBy('status')->pluck('c', 'status'),
            'open_by_priority' => $base()->where('status', '!=', 'done')->select('priority', DB::raw('count(*) c'))->groupBy('priority')->pluck('c', 'priority'),
        ];

        // Charge par membre (projet / équipe)
        if ($scope !== 'user') {
            $rows = Task::query()->whereIn('project_id', $pids)->whereNotNull('assigned_to')
                ->selectRaw("assigned_to, COUNT(*) AS total,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
                    SUM(CASE WHEN status <> 'done' THEN 1 ELSE 0 END) AS open_tasks,
                    SUM(CASE WHEN status <> 'done' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) AS overdue,
                    SUM(CASE WHEN status = 'done' AND updated_at BETWEEN ? AND ? THEN 1 ELSE 0 END) AS done_in_period", [$nowStr, $range[0], $range[1]])
                ->groupBy('assigned_to')->orderByDesc('open_tasks')->limit(15)->get();
            $names = User::whereIn('id', $rows->pluck('assigned_to'))->pluck('name', 'id');
            $report['per_member'] = $rows->map(fn ($r) => [
                'member' => $names[$r->assigned_to] ?? ('#' . $r->assigned_to),
                'link' => $this->mdLink($names[$r->assigned_to] ?? 'Profil', "/users/{$r->assigned_to}"),
                'assigned' => (int) $r->total, 'open' => (int) $r->open_tasks, 'overdue' => (int) $r->overdue, 'done_in_period' => (int) $r->done_in_period,
            ])->all();
            $report['unassigned_open_tasks'] = Task::whereIn('project_id', $pids)->whereNull('assigned_to')->where('status', '!=', 'done')->count();
        }

        // Par projet (équipe / personne)
        if ($scope !== 'project') {
            $rows = $base()->selectRaw("project_id, COUNT(*) AS total,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
                    SUM(CASE WHEN status <> 'done' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) AS overdue", [$nowStr])
                ->groupBy('project_id')->orderByDesc('total')->limit(12)->get();
            $pn = Project::whereIn('id', $rows->pluck('project_id'))->pluck('name', 'id');
            $report['per_project'] = $rows->map(fn ($r) => [
                'project' => $pn[$r->project_id] ?? '#' . $r->project_id,
                'link' => $this->mdLink($pn[$r->project_id] ?? 'Projet', "/projects/{$r->project_id}"),
                'tasks' => (int) $r->total, 'done' => (int) $r->done, 'overdue' => (int) $r->overdue,
            ])->all();
        }

        // Échanges et fichiers
        $taskIds = Task::whereIn('project_id', $pids)->select('id');
        $comments = TaskComment::whereIn('task_id', $taskIds)->whereBetween('created_at', $range)->when($target, fn ($q) => $q->where('user_id', $target->id));
        $files = File::whereIn('project_id', $pids)->whereBetween('created_at', $range)->when($target, fn ($q) => $q->where('user_id', $target->id));
        $report['collaboration'] = [
            'comments_in_period' => (clone $comments)->count(),
            'files_added_in_period' => (clone $files)->count(),
        ];
        if ($scope !== 'user') {
            $top = (clone $comments)->select('user_id', DB::raw('count(*) c'))->groupBy('user_id')->orderByDesc('c')->limit(5)->get();
            $un = User::whereIn('id', $top->pluck('user_id'))->pluck('name', 'id');
            $report['collaboration']['top_commenters'] = $top->map(fn ($r) => ['member' => $un[$r->user_id] ?? '?', 'comments' => (int) $r->c])->all();
        }

        // Journal d'activité : réservé à l'administrateur ou à la personne elle-même
        if ($scope === 'user' && ($this->isAdmin() || $target->id === $this->user->id)) {
            try {
                $report['activity_log'] = DB::table('activities')->where('user_id', $target->id)->whereBetween('created_at', $range)
                    ->select('type', DB::raw('count(*) c'))->groupBy('type')->pluck('c', 'type');
            } catch (\Throwable $e) {
                // table absente : on ignore
            }
        }

        // À surveiller / temps forts
        $report['at_risk'] = $base()->with(['project:id,name', 'assignedUser:id,name'])
            ->where('status', '!=', 'done')->whereNotNull('due_date')->where('due_date', '<', $nowStr)
            ->orderBy('due_date')->limit(8)->get()->map(fn ($t) => [
                'task' => $this->mdLink($t->title, "/tasks/{$t->id}"),
                'days_late' => (int) $t->due_date->diffInDays(now()),
                'assignee' => $t->assignedUser?->name,
                'project' => $t->project?->name,
                'priority' => $t->priority,
            ])->all();
        $report['highlights'] = $base()->with(['project:id,name', 'assignedUser:id,name'])
            ->where('status', 'done')->whereBetween('updated_at', $range)
            ->latest('updated_at')->limit(8)->get()->map(fn ($t) => [
                'task' => $this->mdLink($t->title, "/tasks/{$t->id}"), 'assignee' => $t->assignedUser?->name, 'project' => $t->project?->name,
            ])->all();
        $report['method_note'] = "« Terminées dans la période » = tâches au statut terminé dont la dernière modification tombe dans la période (ProJA n'enregistre pas la date de clôture).";

        $link = $scope === 'project' ? "/projects/{$pids[0]}" : '/dashboard';
        return $this->wrap($report, ['type' => 'link', 'label' => $scope === 'project' ? 'Ouvrir le projet' : 'Ouvrir le tableau de bord', 'url' => $link]);
    }
}
