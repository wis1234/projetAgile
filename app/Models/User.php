<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomResetPassword;
use App\Notifications\SubscriptionConfirmation;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * Obtenez les abonnements de l'utilisateur.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->latest();
    }

    /**
     * Obtenez l'abonnement actif de l'utilisateur.
     */
    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('ends_at', '>', now())
            ->latest();
    }

    /**
     * Obtenez le dernier abonnement de l'utilisateur.
     */
    public function latestSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latest();
    }

    /**
     * Vérifie si l'utilisateur a un abonnement actif.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->is_subscribed && 
               $this->subscription_status === 'active' && 
               $this->subscription_ends_at && 
               $this->subscription_ends_at->isFuture();
    }

    /**
     * Vérifie si l'utilisateur a un abonnement en attente de paiement.
     */
    public function hasPendingSubscription(): bool
    {
        return $this->subscription_status === 'pending';
    }

    /**
     * Vérifie si l'utilisateur peut accéder à une fonctionnalité spécifique.
     */
    public function canAccessFeature(string $feature): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        if (!$this->hasActiveSubscription()) {
            return false;
        }

        // Implémentez la logique de vérification des fonctionnalités ici
        return true;
    }

    /**
     * Obtenez l'attribut has_active_subscription.
     */
    public function getHasActiveSubscriptionAttribute(): bool
    {
        return $this->hasActiveSubscription();
    }

    /**
     * Obtenez le nom du plan d'abonnement actuel.
     */
    public function getSubscriptionPlanNameAttribute(): ?string
    {
        if (!$this->currentSubscription) {
            return null;
        }

        return $this->currentSubscription->plan->name ?? 'Inconnu';
    }

    /**
     * Obtenez la date de fin d'abonnement formatée.
     */
    public function getSubscriptionEndsAtFormattedAttribute(): ?string
    {
        return $this->subscription_ends_at?->format('d/m/Y H:i');
    }

    /**
     * Obtenez le nombre de jours restants avant l'expiration de l'abonnement.
     */
    public function getSubscriptionDaysRemainingAttribute(): ?int
    {
        if (!$this->subscription_ends_at) {
            return null;
        }

        return now()->diffInDays($this->subscription_ends_at, false);
    }

    /**
     * Vérifie si l'abonnement expire bientôt.
     */
    public function isSubscriptionExpiringSoon(int $days = 30): bool
    {
        if (!$this->subscription_ends_at) {
            return false;
        }

        return $this->hasActiveSubscription() && 
               $this->subscription_ends_at->lte(now()->addDays($days)) && 
               $this->subscription_ends_at->gt(now());
    }

    /**
     * Envoie une notification de confirmation d'abonnement.
     */
    public function sendSubscriptionConfirmation(Subscription $subscription): void
    {
        $this->notify(new SubscriptionConfirmation($subscription));
    }

    /**
     * Vérifie si l'utilisateur est un administrateur.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Vérifie si l'utilisateur est un manager.
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    /**
     * Vérifie si l'utilisateur est un membre standard.
     */
    public function isMember(): bool
    {
        return $this->hasRole('member');
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'bio',
        'job_title',
        'company',
        'profile_photo_path',
        'role', // Ajouté pour la gestion des rôles
        'school_id', // Ajouté pour la relation avec l'école
        // Champs d'abonnement
        'current_subscription_id',
        'subscription_ends_at',
        'is_subscribed',
        'subscription_status',
        'billing_email',
        'billing_phone',
        'billing_address',
        'billing_city',
        'billing_country',
        'billing_postal_code',
        'tax_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'profile_photo_url',
        'has_active_subscription',
        'subscription_plan_name',
        'subscription_ends_at_formatted',
        'subscription_days_remaining',
    ];

    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'is_subscribed' => 'boolean',
    ];

    /**
     * Les attributs qui doivent être mutés en dates.
     *
     * @var array<string>
     */
    protected $dates = [
        'subscription_ends_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function projects() {
        return $this->belongsToMany(Project::class)->withPivot('role')->withTimestamps();
    }
    
    /**
     * Récupère les projets où l'utilisateur est manager
     */
    public function managedProjects()
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->select('projects.*') // Spécifie explicitement la table pour éviter l'ambiguïté
            ->wherePivot('role', 'manager')
            ->withTimestamps();
    }
    public function files() {
        return $this->hasMany(File::class);
    }
    public function messages() {
        return $this->hasMany(Message::class);
    }
    public function auditLogs() {
        return $this->hasMany(AuditLog::class);
    }
    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    /**
     * Relation avec l'école de l'utilisateur
     */
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }

    /**
     * Vérifie si l'utilisateur est administrateur d'une école
     */
    public function isSchoolAdmin()
    {
        return $this->role === 'school_admin' && $this->school_id !== null;
    }

    /**
     * Vérifie si l'utilisateur est administrateur de l'école spécifiée
     */
    public function isAdminOfSchool($schoolId)
    {
        return $this->isSchoolAdmin() && $this->school_id == $schoolId;
    }

    /**
     * Récupère le nom de l'école de l'utilisateur
     */
    public function getSchoolNameAttribute()
    {
        return $this->school ? $this->school->name : 'Aucune école';
    }

    /**
     * Récupère le code de l'école de l'utilisateur
     */
    public function getSchoolCodeAttribute()
    {
        return $this->school ? $this->school->code : null;
    }

    /**
     * Vérifie si l'utilisateur peut gérer une école spécifique
     */
    public function canManageSchool($schoolId = null)
    {
        // Les administrateurs système peuvent tout gérer
        if ($this->hasRole('admin')) {
            return true;
        }

        // Les administrateurs d'école ne peuvent gérer que leur école
        if ($this->isSchoolAdmin()) {
            return $schoolId ? $this->school_id == $schoolId : false;
        }

        return false;
    }

    /**
     * Get the URL to the user's profile photo.
     *
     * @return string
     */
    public function getProfilePhotoUrlAttribute()
    {
        if ($this->profile_photo_path) {
            return asset('storage/' . $this->profile_photo_path);
        }
        
        return 'https://ui-avatars.com/api/?name='.urlencode($this->name).'&color=FFFFFF&background=0D8ABC';
    }
}
