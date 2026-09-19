<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Regroupement de plusieurs quiz pour calculer une moyenne générale par candidat.
 */
class QuizCumul extends Model
{
    public const MISSING_ZERO = 'zero';     // un quiz non passé compte pour 0
    public const MISSING_IGNORE = 'ignore'; // un quiz non passé est ignoré dans la moyenne

    protected $fillable = [
        'project_id',
        'created_by',
        'title',
        'description',
        'missing_policy',
        'include_bonus',
    ];

    protected $casts = [
        'include_bonus' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuizCumulItem::class);
    }
}
