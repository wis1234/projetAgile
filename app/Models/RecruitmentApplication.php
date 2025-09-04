<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecruitmentApplication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'recruitment_id',
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'cover_letter',
        'resume_path',
        'status',
        'notes',
        'custom_fields',
        'source'
    ];

    protected $casts = [
        'custom_fields' => 'array'
    ];

    // Constantes pour les statuts
    const STATUS_PENDING = 'pending';
    const STATUS_REVIEWED = 'reviewed';
    const STATUS_INTERVIEWED = 'interviewed';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';

    // Relations
    public function recruitment()
    {
        return $this->belongsTo(Recruitment::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeReviewed($query)
    {
        return $query->where('status', self::STATUS_REVIEWED);
    }

    // Méthodes utilitaires
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getStatusLabelAttribute()
    {
        return [
            self::STATUS_PENDING => 'En attente',
            self::STATUS_REVIEWED => 'Examinée',
            self::STATUS_INTERVIEWED => 'En entretien',
            self::STATUS_ACCEPTED => 'Acceptée',
            self::STATUS_REJECTED => 'Rejetée'
        ][$this->status] ?? $this->status;
    }

    public function getResumeUrlAttribute()
    {
        return $this->resume_path ? asset('storage/' . $this->resume_path) : null;
    }
}
