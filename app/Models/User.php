<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

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
    protected $appends = ['profile_photo_url'];

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
