<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'price',
        'duration_in_months',
        'description',
        'features',
        'is_active',
    ];

    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'duration_in_months' => 'integer',
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    /**
     * Les attributs ajoutés au modèle.
     *
     * @var array<string>
     */
    protected $appends = [
        'formatted_price',
        'formatted_duration',
    ];

    /**
     * Obtenez les abonnements associés à ce plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Obtenez uniquement les plans actifs.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Obtenez le prix formaté avec la devise.
     *
     * @return string
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', ' ') . ' FCFA';
    }

    /**
     * Obtenez la durée formatée de l'abonnement.
     *
     * @return string
     */
    public function getFormattedDurationAttribute(): string
    {
        $months = $this->duration_in_months;
        
        if ($months < 1) {
            return 'Personnalisé';
        }
        
        if ($months == 1) {
            return '1 mois';
        }
        
        if ($months < 12) {
            return "{$months} mois";
        }
        
        $years = floor($months / 12);
        $remainingMonths = $months % 12;
        
        if ($remainingMonths == 0) {
            return $years == 1 ? '1 an' : "{$years} ans";
        }
        
        return $years . ' an' . ($years > 1 ? 's' : '') . ' et ' . $remainingMonths . ' mois';
    }
}
