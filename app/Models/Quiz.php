<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Quiz extends Model
{
    use HasFactory;

    public const TYPE_QCM = 'qcm';
    public const TYPE_WRITTEN = 'written';
    public const TYPE_MIXED = 'mixed';

    public const DELIBERATION_NONE = 'none';
    public const DELIBERATION_OPEN = 'open';
    public const DELIBERATION_VALIDATED = 'validated';

    protected $fillable = [
        'project_id',
        'created_by',
        'title',
        'description',
        'quiz_type',
        'duration_minutes',
        'max_attempts',
        'is_active',
        'is_draft',
        'show_results',
        'public_token',
        'allow_public_access',
        'deliberation_status',
        'deliberation_opened_at',
        'validated_at',
        'validated_fingerprint',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_draft' => 'boolean',
        'show_results' => 'boolean',
        'deliberation_opened_at' => 'datetime',
        'validated_at' => 'datetime',
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

    public function approvals(): HasMany
    {
        return $this->hasMany(QuizApproval::class);
    }

    public function cumulItems(): HasMany
    {
        return $this->hasMany(QuizCumulItem::class);
    }

    public function isValidated(): bool
    {
        return $this->deliberation_status === self::DELIBERATION_VALIDATED;
    }

    /**
     * Vrai dès qu'au moins un candidat a terminé le quiz : la structure (nombre / type de
     * questions, bonne réponse) est alors figée pour ne pas fausser les résultats existants.
     */
    public function hasCompletedAttempts(): bool
    {
        return $this->attempts()->where('status', 'completed')->exists();
    }

    /**
     * Les responsables « décideurs » : managers actifs du projet. À défaut, le concepteur du quiz.
     */
    public function deciders(): Collection
    {
        $managers = $this->project->managers()->get();

        if ($managers->isNotEmpty()) {
            return $managers;
        }

        return $this->creator ? collect([$this->creator]) : collect();
    }

    /**
     * Les quiz visibles pour un utilisateur : les brouillons ne sont visibles que des gestionnaires.
     */
    public function scopeVisibleFor($query, bool $canManage)
    {
        return $canManage ? $query : $query->where('is_draft', false);
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
