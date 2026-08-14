<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskComment extends Model
{
    protected $fillable = ['task_id', 'user_id', 'content', 'audio_path', 'image_path', 'parent_id', 'level'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mentions()
{
    return $this->belongsToMany(User::class, 'comment_mentions', 'task_comment_id', 'user_id');
}

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TaskComment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TaskComment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(TaskCommentReaction::class, 'task_comment_id');
    }

    public function allRepliesWithUser()
    {
        return $this->replies()->with(['user', 'replies' => function($q) {
            $q->with('user');
        }]);
    }
}