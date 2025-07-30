<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class School extends Model
{
    use SoftDeletes, LogsActivity;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
        'type',
        'status',
        'description',
        'address',
        'postal_code',
        'city',
        'country',
        'email',
        'phone',
        'website',
        'principal_name',
        'capacity',
        'created_by',
        'updated_by',
    ];

    // Types d'écoles
    public const TYPE_PRIMARY = 'primary';
    public const TYPE_MIDDLE = 'middle';
    public const TYPE_HIGH = 'high';
    public const TYPE_UNIVERSITY = 'university';
    public const TYPE_OTHER = 'other';

    // Statuts
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_PENDING = 'pending';

    /**
     * Retourne les types d'écoles disponibles avec leurs libellés
     *
     * @return array
     */
    public static function getTypeOptions(): array
    {
        return [
            self::TYPE_PRIMARY => 'École primaire',
            self::TYPE_MIDDLE => 'Collège',
            self::TYPE_HIGH => 'Lycée',
            self::TYPE_UNIVERSITY => 'Université',
            self::TYPE_OTHER => 'Autre',
        ];
    }

    /**
     * Retourne les statuts disponibles avec leurs libellés
     *
     * @return array
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_ACTIVE => 'Actif',
            self::STATUS_INACTIVE => 'Inactif',
            self::STATUS_PENDING => 'En attente',
        ];
    }

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Configuration du journal des activités
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "L'établissement a été " . __("activitylog.{$eventName}"));
    }

    /**
     * Relation avec l'utilisateur qui a créé l'établissement
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec l'utilisateur qui a mis à jour l'établissement
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relation avec les administrateurs de l'établissement
     */
    public function hosts()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relation avec les salles de classe de l'établissement
     */
    public function classRooms(): HasMany
    {
        return $this->hasMany(ClassRoom::class);
    }

    /**
     * Relation avec les enseignants de l'établissement
     */
    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    /**
     * Relation avec les étudiants de l'établissement
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Relation avec les matières enseignées dans l'établissement
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Vérifie si l'utilisateur est administrateur de l'établissement
     */
    public function isHostedBy(User $user): bool
    {
        return $this->hosts()->where('id', $user->id)->exists();
    }

    /**
     * Récupère le nombre total d'utilisateurs associés à l'établissement
     */
    public function getUsersCountAttribute(): int
    {
        return $this->hosts()->count() + 
               $this->teachers()->count() + 
               $this->students()->count();
    }

    /**
     * Récupère le type d'établissement formaté
     */
    public function getFormattedTypeAttribute(): string
    {
        return [
            self::TYPE_PRIMARY => 'École primaire',
            self::TYPE_MIDDLE => 'Collège',
            self::TYPE_HIGH => 'Lycée',
            self::TYPE_UNIVERSITY => 'Université',
            self::TYPE_OTHER => 'Autre',
        ][$this->type] ?? $this->type;
    }

    /**
     * Récupère le statut formaté
     */
    public function getFormattedStatusAttribute(): string
    {
        return [
            self::STATUS_ACTIVE => 'Actif',
            self::STATUS_INACTIVE => 'Inactif',
            self::STATUS_PENDING => 'En attente',
        ][$this->status] ?? $this->status;
    }

    /**
     * Récupère la couleur du statut
     */
    public function getStatusColorAttribute(): string
    {
        return [
            self::STATUS_ACTIVE => 'green',
            self::STATUS_INACTIVE => 'red',
            self::STATUS_PENDING => 'yellow',
        ][$this->status] ?? 'gray';
    }

    /**
     * Récupère l'adresse complète formatée
     */
    public function getFullAddressAttribute(): string
    {
        $parts = [
            $this->address,
            $this->postal_code,
            $this->city,
            $this->country,
        ];

        return implode(', ', array_filter($parts));
    }

    /**
     * Scope pour les établissements actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope pour la recherche
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
    }
}
