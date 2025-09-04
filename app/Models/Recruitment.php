<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recruitment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'status',
        'type',
        'location',
        'salary_min',
        'salary_max',
        'experience_level',
        'education_level',
        'skills',
        'created_by',
        'deadline',
        'auto_close'
    ];
    
    protected $dates = [
        'deadline',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'skills' => 'array',
        'salary_min' => 'float',
        'salary_max' => 'float',
        'auto_close' => 'boolean',
        'deadline' => 'datetime'
    ];
    
    protected static function boot()
    {
        parent::boot();

        // Vérifier et mettre à jour le statut avant chaque requête
        static::saving(function ($model) {
            $model->checkAndUpdateStatus();
        });
    }
    
    /**
     * Vérifie et met à jour le statut en fonction de la date limite
     */
    public function checkAndUpdateStatus()
    {
        if ($this->auto_close && $this->deadline && $this->status !== self::STATUS_CLOSED) {
            if (now()->greaterThan($this->deadline)) {
                $this->status = self::STATUS_CLOSED;
            }
        }
    }
    
    /**
     * Vérifie si l'offre est expirée
     */
    public function isExpired(): bool
    {
        return $this->deadline && now()->greaterThan($this->deadline);
    }
    
    /**
     * Récupère le temps restant avant la date limite
     */
    public function getTimeRemaining(): ?array
    {
        if (!$this->deadline) {
            return null;
        }
        
        $now = now();
        $diff = $now->diff($this->deadline);
        
        return [
            'days' => $diff->d,
            'hours' => $diff->h,
            'minutes' => $diff->i,
            'seconds' => $diff->s,
            'is_expired' => $now->greaterThan($this->deadline)
        ];
    }

    // Constantes pour les statuts
    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_CLOSED = 'closed';

    // Constantes pour les types de contrat
    const TYPE_CDI = 'CDI';
    const TYPE_CDD = 'CDD';
    const TYPE_INTERIM = 'Intérim';
    const TYPE_STAGE = 'Stage';
    const TYPE_ALTERNANCE = 'Alternance';

    // Relations
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications()
    {
        return $this->hasMany(RecruitmentApplication::class);
    }

    /**
     * Relation avec les champs personnalisés
     */
    public function customFields()
    {
        return $this->hasMany(RecruitmentCustomField::class)->orderBy('order');
    }

    /**
     * Obtenir les champs personnalisés ordonnés
     */
    public function getOrderedCustomFields()
    {
        return $this->customFields->sortBy('order');
    }

    /**
     * Vérifier si l'offre a des champs personnalisés
     */
    public function hasCustomFields(): bool
    {
        return $this->customFields->isNotEmpty();
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeActive($query)
    {
        return $query->where('status', '!=', self::STATUS_CLOSED);
    }

    // Méthodes utilitaires
    public function isPublished()
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isClosed()
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * Vérifie si l'utilisateur peut voir cette offre
     */
    public function canBeViewedBy(?User $user): bool
    {
        // Si l'offre est publiée, tout le monde peut la voir
        if ($this->status === self::STATUS_PUBLISHED) {
            return true;
        }

        // Si l'offre est en brouillon, seul le créateur ou un admin peut la voir
        if ($this->status === self::STATUS_DRAFT) {
            return $user && ($user->id === $this->created_by || $user->hasRole(['admin', 'manager']));
        }

        // Pour les offres clôturées, tout le monde peut les voir
        return true;
    }

    public function getStatusLabelAttribute()
    {
        return [
            self::STATUS_DRAFT => 'Brouillon',
            self::STATUS_PUBLISHED => 'Publiée',
            self::STATUS_CLOSED => 'Clôturée'
        ][$this->status] ?? $this->status;
    }

    public function getTypeLabelAttribute()
    {
        return [
            self::TYPE_CDI => 'CDI',
            self::TYPE_CDD => 'CDD',
            self::TYPE_INTERIM => 'Intérim',
            self::TYPE_STAGE => 'Stage',
            self::TYPE_ALTERNANCE => 'Alternance'
        ][$this->type] ?? $this->type;
    }
}
