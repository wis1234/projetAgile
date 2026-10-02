<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Withdrawal extends Model
{
    public const STATUS_PENDING    = 'pending';     // demande enregistrée, pas encore envoyée à Fedapay
    public const STATUS_PROCESSING = 'processing';  // envoyée à Fedapay, en attente de l'opérateur
    public const STATUS_COMPLETED  = 'completed';   // argent reçu par le bénéficiaire
    public const STATUS_FAILED     = 'failed';      // refusée / échouée → montant recrédité
    public const STATUS_CANCELLED  = 'cancelled';   // annulée par l'utilisateur avant envoi

    /** Statuts qui « consomment » le solde (le montant est retenu). */
    public const HOLDING = [self::STATUS_PENDING, self::STATUS_PROCESSING, self::STATUS_COMPLETED];

    protected $fillable = [
        'reference', 'user_id', 'amount', 'fee', 'currency', 'method', 'phone_number', 'country',
        'status', 'fedapay_payout_id', 'fedapay_status', 'failure_reason', 'checks', 'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Withdrawal $w) {
            $w->reference = $w->reference ?: 'WD-' . strtoupper(Str::random(10));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isFinal(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED], true);
    }

    /** Représentation exposée au front (numéro partiellement masqué). */
    public function toPayload(): array
    {
        $phone = (string) $this->phone_number;
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => (float) $this->amount,
            'fee' => (float) $this->fee,
            'currency' => $this->currency,
            'method' => $this->method,
            'phone_masked' => strlen($phone) > 6 ? substr($phone, 0, 4) . str_repeat('•', max(strlen($phone) - 7, 2)) . substr($phone, -3) : $phone,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'can_cancel' => $this->status === self::STATUS_PENDING && !$this->fedapay_payout_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'processed_at' => $this->processed_at?->toIso8601String(),
        ];
    }
}
