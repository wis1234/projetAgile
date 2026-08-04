<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory;

    public const TYPE_QCM = 'qcm';
    public const TYPE_WRITTEN = 'written';
    public const TYPE_MIXED = 'mixed';

    protected $fillable = [
        'project_id',
        'created_by',
        'title',
        'description',
        'quiz_type',
        'duration_minutes',
        'max_attempts',
        'is_active',
        'show_results',
        'public_token',
        'allow_public_access',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_results' => 'boolean',
        'allow_public_access' => 'boolean',
        'duration_minutes' => 'integer',
        'max_attempts' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($quiz) {
            $quiz->questions()->delete();
            $quiz->attempts()->delete();
            $quiz->results()->delete();
            $quiz->responses()->delete();
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(QuizResult::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(QuizResponse::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }
}
