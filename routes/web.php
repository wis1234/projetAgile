<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Routes protégées par authentification
Route::middleware('auth')->group(function () {
    // Tableau de bord et profil
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/', [App\Http\Controllers\DashboardController::class, 'index']);
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile/photo', [ProfileController::class, 'destroyPhoto'])->name('profile.photo.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Notifications
    Route::get('/notifications', function () {
        return auth()->user()->notifications()->orderBy('created_at', 'desc')->limit(20)->get();
    });
    
    // Ressources principales
    Route::resource('tasks', App\Http\Controllers\TaskController::class);
    Route::resource('sprints', App\Http\Controllers\SprintController::class);
    Route::resource('projects', App\Http\Controllers\ProjectController::class);
    Route::resource('files', App\Http\Controllers\FileController::class);
    Route::resource('messages', App\Http\Controllers\MessageController::class);
    Route::resource('audit-logs', App\Http\Controllers\AuditLogController::class);
    Route::resource('project-users', App\Http\Controllers\ProjectUserController::class);
    
    // Routes personnalisées pour les tâches
    Route::post('/tasks/{task}/payment', [App\Http\Controllers\TaskController::class, 'savePaymentInfo'])->name('tasks.payment.save');
    Route::post('/tasks/{task}/payment/validate/{taskPayment}', [App\Http\Controllers\TaskController::class, 'validatePayment'])->name('tasks.payment.validate');
    Route::get('/tasks/{task}/download-receipt', [App\Http\Controllers\TaskController::class, 'downloadReceipt'])->name('tasks.receipt.download');
    
    // Tableau Kanban
    Route::get('/kanban', [App\Http\Controllers\KanbanController::class, 'index'])->name('kanban.index');
    Route::put('/kanban/update-order', [App\Http\Controllers\KanbanController::class, 'updateOrder'])->name('kanban.updateOrder');
    
    // Gestion des projets
    Route::patch('/projects/{id}/status', [App\Http\Controllers\ProjectController::class, 'changeStatus'])->name('projects.change-status');
    
    // Gestion des fichiers
    Route::put('files/{file}/content', [App\Http\Controllers\FileController::class, 'updateContent'])->name('files.updateContent');
    Route::get('files/{file}/download', [App\Http\Controllers\FileController::class, 'download'])->name('files.download');
    Route::post('files/download-multiple', [App\Http\Controllers\FileController::class, 'downloadMultiple'])->name('files.downloadMultiple');
    
    // API endpoints
    Route::prefix('api')->group(function () {
        // Projets et utilisateurs
        Route::get('/projects/{id}', [\App\Http\Controllers\ProjectController::class, 'apiShow']);
        Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'apiShow']);
        
        // Commentaires des tâches
        Route::get('/tasks/{task}/comments', [\App\Http\Controllers\TaskCommentController::class, 'index']);
        Route::post('/tasks/{task}/comments', [\App\Http\Controllers\TaskCommentController::class, 'store']);
        Route::put('/tasks/{task}/comments/{comment}', [\App\Http\Controllers\TaskCommentController::class, 'update']);
        Route::delete('/tasks/{task}/comments/{comment}', [\App\Http\Controllers\TaskCommentController::class, 'destroy']);
        
        // Commentaires des fichiers
        Route::get('/files/{file}/comments', [\App\Http\Controllers\FileCommentController::class, 'index']);
        Route::post('/files/{file}/comments', [\App\Http\Controllers\FileCommentController::class, 'store']);
        Route::put('/files/{file}/comments/{comment}', [\App\Http\Controllers\FileCommentController::class, 'update']);
        Route::delete('/files/{file}/comments/{comment}', [\App\Http\Controllers\FileCommentController::class, 'destroy']);
        
        // Notifications d'activités
        Route::get('/activities/notifications', [ActivityController::class, 'notifications']);
        
        // Gestion des dossiers Dropbox
        Route::get('/dropbox/folders', [App\Http\Controllers\DropboxController::class, 'listFolders'])->name('api.dropbox.folders');
        Route::post('/dropbox/folders', [App\Http\Controllers\DropboxController::class, 'createFolder'])->name('api.dropbox.folders.create');
        
        // Upload vers Dropbox avec chemin personnalisé
        Route::post('/files/{file}/save-to-dropbox', [App\Http\Controllers\DropboxController::class, 'uploadToDropbox'])
            ->name('api.files.save-to-dropbox');
    });
});

// Gestion des utilisateurs (partie publique)
Route::middleware(['auth'])->group(function () {
    // Routes réservées aux administrateurs
    Route::middleware('can:admin-only')->group(function () {
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
    
    // Routes accessibles à tous les utilisateurs connectés
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/assign-role', [\App\Http\Controllers\UserController::class, 'assignRole'])->name('users.assignRole');
});

// Activités
Route::middleware(['auth'])->group(function () {
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('/activities/export', [ActivityController::class, 'export'])->name('activities.export');
    Route::get('/activities/{activity}', [ActivityController::class, 'show'])->name('activities.show');
});

// Gestion des établissements scolaires
Route::middleware(['auth'])->group(function () {
    Route::resource('schools', \App\Http\Controllers\SchoolController::class);
    
    // Routes réservées aux administrateurs
    Route::middleware('can:admin-only')->group(function () {
        Route::get('/schools/{school}/hosts', [\App\Http\Controllers\SchoolController::class, 'indexHosts'])->name('schools.hosts.index');
        Route::post('/schools/{school}/hosts', [\App\Http\Controllers\SchoolController::class, 'addHost'])->name('schools.hosts.add');
        Route::delete('/schools/{school}/hosts/{user}', [\App\Http\Controllers\SchoolController::class, 'removeHost'])->name('schools.hosts.remove');
    });
});

// Gestion des rôles (création/suppression)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/roles/create', [\App\Http\Controllers\UserController::class, 'createRole'])->name('roles.create');
    Route::delete('/roles/{role}', [\App\Http\Controllers\UserController::class, 'deleteRole'])->name('roles.destroy');
});

// Fichiers : accès direct à la vue
Route::get('/fichiers', function () {
    return Inertia::render('Files/Index');
})->middleware(['auth', 'verified'])->name('fichiers');

// Route pour exécuter la file d'attente manuellement (à protéger en production)
Route::get('/queue/work', function () {
    if (app()->environment('local')) {
        try {
            // Exécuter la file d'attente avec un délai d'expiration
            $exitCode = \Artisan::call('queue:work', [
                '--stop-when-empty' => true,
                '--tries' => 3,
                '--timeout' => 60
            ]);
            
            // Récupérer la sortie de la commande
            $output = \Artisan::output();
            
            // Journaliser l'exécution
            \Log::info('File d\'attente exécutée manuellement', [
                'exit_code' => $exitCode,
                'output' => $output,
                'jobs_processed' => trim($output) !== '' ? count(explode("\n", trim($output))) : 0
            ]);
            
            return response()->json([
                'status' => 'success',
                'message' => 'File d\'attente traitée avec succès',
                'output' => $output,
                'jobs_processed' => trim($output) !== '' ? count(explode("\n", trim($output))) : 0
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'exécution de la file d\'attente', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors du traitement de la file d\'attente',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    return response()->json(['status' => 'error', 'message' => 'Non autorisé'], 403);
});

require __DIR__.'/auth.php';
