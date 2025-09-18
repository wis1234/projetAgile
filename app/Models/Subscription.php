<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    /**
     * Les états possibles d'un abonnement.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'subscription_plan_id',
        'status',
        'starts_at',
        'ends_at',
        'cancelled_at',
        'payment_id',
        'payment_method',
        'amount_paid',
        'currency',
        'payment_details',
        'receipt_url',
        'is_renewal',
    ];

    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'amount_paid' => 'decimal:2',
        'payment_details' => 'array',
        'is_renewal' => 'boolean',
    ];

    /**
     * Les attributs qui doivent être mutés en dates.
     *
     * @var array<string>
     */
    protected $dates = [
        'starts_at',
        'ends_at',
        'cancelled_at',
    ];

    /**
     * Obtenez l'utilisateur propriétaire de l'abonnement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtenez le plan d'abonnement associé.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    /**
     * Vérifie si l'abonnement est actif.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE && 
               $this->ends_at->isFuture();
    }

    /**
     * Vérifie si l'abonnement est en attente de paiement.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Vérifie si l'abonnement est expiré.
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED || 
               ($this->status === self::STATUS_ACTIVE && $this->ends_at->isPast());
    }

    /**
     * Vérifie si l'abonnement est annulé.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Vérifie si l'abonnement expire bientôt.
     * 
     * @param int $days Nombre de jours avant l'expiration
     * @return bool
     */
    public function isExpiringSoon(int $days = 30): bool
    {
        return $this->isActive() && 
               $this->ends_at->lte(now()->addDays($days)) && 
               $this->ends_at->gt(now());
    }

    /**
     * Obtenez le temps restant avant l'expiration formaté.
     */
    public function getTimeRemainingAttribute(): string
    {
        if ($this->isExpired()) {
            return 'Expiré';
        }

        if ($this->isActive()) {
            $now = now();
            $end = $this->ends_at;
            
            if ($end->diffInDays($now) > 30) {
                return 'Expire dans ' . $end->diffInMonths($now) . ' mois';
            }
            
            if ($end->diffInDays($now) > 0) {
                return 'Expire dans ' . $end->diffInDays($now) . ' jours';
            }
            
            if ($end->diffInHours($now) > 0) {
                return 'Expire dans ' . $end->diffInHours($now) . ' heures';
            }
            
            return 'Expire bientôt';
        }

        return 'Non actif';
    }

    /**
     * Obtenez le pourcentage d'utilisation de l'abonnement.
     */
    public function getUsagePercentageAttribute(): int
    {
        if (!$this->starts_at || !$this->ends_at || $this->isExpired()) {
            return 100;
        }

        $totalDays = $this->starts_at->diffInDays($this->ends_at);
        $daysPassed = $this->starts_at->diffInDays(now());
        
        return min(100, max(0, (int) (($daysPassed / $totalDays) * 100)));
    }
}
