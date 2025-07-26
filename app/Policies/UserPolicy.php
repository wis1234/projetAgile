<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Debug: Log user data and role checks
        \Log::info('UserPolicy::create called', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role_field' => $user->role,
            'user_email' => $user->email,
            'has_admin_role' => method_exists($user, 'hasRole') ? $user->hasRole('admin') : 'method_not_exists',
            'has_manager_role' => method_exists($user, 'hasRole') ? $user->hasRole('manager') : 'method_not_exists',
        ]);
        
        // Support both database role field and Spatie Permission
        $canCreate = $user->role === 'admin' || 
                    $user->role === 'manager' || 
                    (method_exists($user, 'hasRole') && $user->hasRole('admin')) || 
                    (method_exists($user, 'hasRole') && $user->hasRole('manager'));
        
        \Log::info('UserPolicy::create result', ['can_create' => $canCreate]);
        
        return $canCreate;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Support both database role field and Spatie Permission
        return $user->role === 'admin' || 
               $user->role === 'manager' || 
               $user->hasRole('admin') || 
               $user->hasRole('manager') || 
               $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Support both database role field and Spatie Permission
        return $user->role === 'admin' || 
               ($user->role === 'manager' && $user->id !== $model->id) ||
               $user->hasRole('admin') || 
               ($user->hasRole('manager') && $user->id !== $model->id);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        // Support both database role field and Spatie Permission
        return $user->role === 'admin' || 
               $user->role === 'manager' || 
               $user->hasRole('admin') || 
               $user->hasRole('manager');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Support both database role field and Spatie Permission
        return $user->role === 'admin' || $user->hasRole('admin');
    }
}