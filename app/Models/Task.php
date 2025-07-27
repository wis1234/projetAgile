<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'due_date',
        'status',
        'priority',
        'project_id',
        'assigned_to',
        'created_by',
        'sprint_id',
        'is_paid',
        'payment_reason',
        'amount',
        'payment_status',
        'paid_at',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'is_paid' => 'boolean',
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    // Payment status constants
    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_FAILED = 'failed';

    // Payment reason constants
    const REASON_VOLUNTEER = 'volunteer';
    const REASON_ACADEMIC = 'academic';
    const REASON_OTHER = 'other';

    /**
     * Get the payment status options.
     *
     * @return array
     */
    public static function getPaymentStatuses()
    {
        return [
            self::PAYMENT_STATUS_UNPAID => 'Non payé',
            self::PAYMENT_STATUS_PENDING => 'En attente',
            self::PAYMENT_STATUS_PAID => 'Payé',
            self::PAYMENT_STATUS_FAILED => 'Échoué',
        ];
    }

    /**
     * Get the payment reason options.
     *
     * @return array
     */
    public static function getPaymentReasons()
    {
        return [
            self::REASON_VOLUNTEER => 'Bénévolat',
            self::REASON_ACADEMIC => 'Projet académique',
            self::REASON_OTHER => 'Autre raison',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        // Suppression en cascade lors de la suppression d'une tâche
        static::deleting(function ($task) {
            // Supprimer tous les commentaires de la tâche
            $task->comments()->delete();
        });
    }

    public function assignedUser() {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    public function project() {
        return $this->belongsTo(Project::class);
    }
    public function sprint() {
        return $this->belongsTo(Sprint::class);
    }

    public function comments() {
        return $this->hasMany(\App\Models\TaskComment::class);
    }

    public function files() {
        return $this->hasMany(File::class);
    }

    public function payments()
    {
        return $this->hasMany(TaskPayment::class);
    }
}
