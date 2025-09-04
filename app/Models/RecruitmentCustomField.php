<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruitmentCustomField extends Model
{
    protected $fillable = [
        'recruitment_id',
        'field_name',
        'field_label',
        'field_type',
        'is_required',
        'options',
        'order'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'options' => 'array',
        'order' => 'integer'
    ];

    /**
     * Relation avec l'offre de recrutement
     */
    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }

    /**
     * Obtenir les options du champ sous forme de tableau
     */
    public function getOptionsArray(): array
    {
        return $this->options ?: [];
    }
}
