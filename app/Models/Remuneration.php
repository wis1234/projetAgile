<?php

namespace App\Models;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Remuneration extends Model
{
    use HasFactory;

    // ✅ Statuts
    public const STATUS_PENDING   = 'pending';
    public const STATUS_PAID      = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    // ✅ Types
    public const TYPE_TASK   = 'task_completion';
    public const TYPE_BONUS  = 'bonus';
    public const TYPE_REFUND = 'refund';
    public const TYPE_OTHER  = 'other';

    protected $fillable = [
        'task_id',
        'user_id',
        'amount',
        'status',
        'type',
        'description',
        'payment_date',
        'payment_method',
        'transaction_reference',
        'notes',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'payment_date' => 'date',
        'approved_at'  => 'datetime',
    ];

    // Dates gérées automatiquement par Eloquent
    protected $dates = [
        'payment_date',
        'approved_at',
        'created_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Accessors dynamiques
    protected $appends = [
        'formatted_amount',
        'status_badge',
        'can_edit',
        'can_delete',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */
    
    /**
     * Get the task that owns the remuneration.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
    
    /**
     * Get the user that owns the remuneration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who approved the remuneration.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Filtre les rémunérations par statut
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Filtre les rémunérations en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Filtre les rémunérations payées
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    /**
     * Filtre les rémunérations annulées
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Filtre les rémunérations par type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
    
    /**
     * Filtre les rémunérations par utilisateur
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function markAsPaid(array $paymentDetails = []): bool
    {
        if (!$this->canBePaid()) {
            return false;
        }

        return $this->update([
            'status'               => self::STATUS_PAID,
            'payment_date'         => now(),
            'payment_method'       => $paymentDetails['method'] ?? null,
            'transaction_reference'=> $paymentDetails['reference'] ?? null,
            'approved_by'          => Auth::id(),
            'approved_at'          => now(),
        ]);
    }

    public function canBePaid(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canBeCancelled(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2, ',', ' ') . ' FCFA';
    }

    public function getCanEditAttribute(): bool
    {
        return Auth::check() && Auth::user()->can('update', $this);
    }

    public function getCanDeleteAttribute(): bool
    {
        return Auth::check() && Auth::user()->can('delete', $this);
    }

    public function getStatusBadgeAttribute(): array
    {
        $statuses = [
            self::STATUS_PENDING => [
                'label' => 'En attente',
                'class' => 'bg-yellow-100 text-yellow-800',
                'icon'  => 'clock',
            ],
            self::STATUS_PAID => [
                'label' => 'Payée',
                'class' => 'bg-green-100 text-green-800',
                'icon'  => 'check-circle',
            ],
            self::STATUS_CANCELLED => [
                'label' => 'Annulée',
                'class' => 'bg-red-100 text-red-800',
                'icon'  => 'x-circle',
            ],
        ];

        $status = $statuses[$this->status] ?? [
            'label' => ucfirst($this->status),
            'class' => 'bg-gray-100 text-gray-800',
            'icon'  => 'question-mark-circle',
        ];

        return [
            'html'  => sprintf(
                '<span class="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full %s">
                    <i class="h-4 w-4 mr-1" data-feather="%s"></i>
                    %s
                </span>',
                $status['class'],
                $status['icon'],
                $status['label']
            ),
            'label' => $status['label'],
            'class' => $status['class'],
            'icon'  => $status['icon'],
        ];
    }
}
