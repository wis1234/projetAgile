<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * Bonus de participation attribué à un membre pour son implication pendant les formations.
 */
class ParticipationPoint extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'awarded_by',
        'points',
        'reason',
        'awarded_on',
    ];

    protected $casts = [
        'points' => 'float',
        'awarded_on' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function awarder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }

    /**
     * Total brut par membre (user_id => somme) pour un projet.
     */
    public static function totalsForProject(int $projectId): Collection
    {
        return static::where('project_id', $projectId)
            ->selectRaw('user_id, SUM(points) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id')
            ->map(fn ($v) => (float) $v);
    }

    /**
     * Bonus effectif : jamais négatif, plafonné par config('quiz.participation_cap').
     */
    public static function capped(float $raw): float
    {
        return round(max(0.0, min((float) config('quiz.participation_cap', 10), $raw)), 2);
    }
}
