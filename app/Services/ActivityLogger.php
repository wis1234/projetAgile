<?php

namespace App\Services;

use App\Events\ActivityCreated;
use App\Models\Activity;
use App\Models\File;
use App\Models\Message;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class ActivityLogger
{
    public static function log(string $type, ?string $description = null, ?Model $subject = null, ?int $userId = null): Activity
    {
        $activity = Activity::create([
            'user_id' => $userId ?? Auth::id(),
            'type' => $type,
            'description' => $description,
            'subject_type' => $subject ? $subject->getMorphClass() : null,
            'subject_id' => $subject?->getKey(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        self::broadcast($activity);

        return $activity;
    }

    public static function broadcast(Activity $activity): void
    {
        foreach (self::resolveRecipients($activity) as $recipientId) {
            event(new ActivityCreated($activity, $recipientId));
        }
    }

    /**
     * @return Collection<int, int>
     */
    public static function resolveRecipients(Activity $activity): Collection
    {
        $actorId = $activity->user_id;
        $recipients = collect();

        if (in_array($activity->type, ['login', 'logout'], true)) {
            $recipients = User::role('admin')->pluck('id');
        } else {
            $recipients = User::role('admin')->pluck('id');

            foreach (self::resolveProjectIds($activity) as $projectId) {
                $memberIds = Project::find($projectId)?->users()->pluck('users.id') ?? collect();
                $recipients = $recipients->merge($memberIds);
            }
        }

        return $recipients
            ->unique()
            ->filter(fn ($id) => (int) $id !== (int) $actorId)
            ->filter(fn ($id) => self::userWantsNotification((int) $id, $activity))
            ->values();
    }

    /**
     * @return Collection<int, int>
     */
    public static function resolveProjectIds(Activity $activity): Collection
    {
        if (!$activity->subject_type || !$activity->subject_id) {
            return collect();
        }

        $subject = $activity->subject;

        if (!$subject) {
            return collect();
        }

        return match ($activity->subject_type) {
            Project::class => collect([$subject->id]),
            Task::class => collect([$subject->project_id])->filter(),
            File::class => collect([$subject->project_id])->filter(),
            Sprint::class => collect([$subject->project_id])->filter(),
            TaskComment::class => collect([$subject->task?->project_id])->filter(),
            Message::class => $subject->project_id
                ? collect([$subject->project_id])
                : collect(),
            default => collect(),
        };
    }

    protected static function userWantsNotification(int $userId, Activity $activity): bool
    {
        $user = User::find($userId);

        if (!$user) {
            return false;
        }

        $prefs = $user->notification_preferences;
        $key = self::preferenceKeyForActivity($activity);

        return ($prefs[$key] ?? true) === true;
    }

    protected static function preferenceKeyForActivity(Activity $activity): string
    {
        if (in_array($activity->type, ['login', 'logout'], true)) {
            return 'security_updates';
        }

        if (in_array($activity->type, ['call_started', 'call_ended', 'call_answered'], true)) {
            return 'meeting_updates';
        }

        $subjectType = $activity->subject_type;

        return match (true) {
            $subjectType === Task::class,
            $subjectType === TaskComment::class,
            str_contains((string) $activity->description, 'tâche') => 'task_updates',
            $subjectType === File::class,
            $activity->type === 'upload' => 'file_updates',
            $subjectType === Project::class,
            $subjectType === Sprint::class => 'project_updates',
            default => 'project_updates',
        };
    }
}
