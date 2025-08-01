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

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/', [App\Http\Controllers\DashboardController::class, 'index']);
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::resource('tasks', App\Http\Controllers\TaskController::class);
    Route::post('/tasks/{task}/payment', [App\Http\Controllers\TaskController::class, 'savePaymentInfo'])->name('tasks.payment.save');
    Route::post('/tasks/{task}/payment/validate/{taskPayment}', [App\Http\Controllers\TaskController::class, 'validatePayment'])->name('tasks.payment.validate');
    Route::get('/tasks/{task}/download-receipt', [App\Http\Controllers\TaskController::class, 'downloadReceipt'])->name('tasks.receipt.download');
    Route::get('/kanban', [App\Http\Controllers\KanbanController::class, 'index'])->name('kanban.index');
    Route::put('/kanban/update-order', [App\Http\Controllers\KanbanController::class, 'updateOrder'])->name('kanban.updateOrder');
    Route::resource('sprints', App\Http\Controllers\SprintController::class);
    Route::resource('projects', App\Http\Controllers\ProjectController::class);
    Route::patch('/projects/{id}/status', [App\Http\Controllers\ProjectController::class, 'changeStatus'])->name('projects.change-status');
    Route::resource('files', App\Http\Controllers\FileController::class);
    Route::put('files/{file}/content', [App\Http\Controllers\FileController::class, 'updateContent'])->name('files.updateContent');
    Route::resource('messages', App\Http\Controllers\MessageController::class);
    Route::resource('audit-logs', App\Http\Controllers\AuditLogController::class);
    Route::resource('project-users', App\Http\Controllers\ProjectUserController::class);
    Route::get('files/{file}/download', [App\Http\Controllers\FileController::class, 'download'])->name('files.download');
    Route::post('files/download-multiple', [App\Http\Controllers\FileController::class, 'downloadMultiple'])->name('files.downloadMultiple');
    Route::get('/notifications', function () {
        return auth()->user()->notifications()->orderBy('created_at', 'desc')->limit(20)->get();
    });
    // API endpoints
    Route::prefix('api')->group(function () {
        Route::get('/projects/{id}', [\App\Http\Controllers\ProjectController::class, 'apiShow']);
        Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'apiShow']);
        // Task comments
        Route::get('/tasks/{task}/comments', [\App\Http\Controllers\TaskCommentController::class, 'index']);
        Route::post('/tasks/{task}/comments', [\App\Http\Controllers\TaskCommentController::class, 'store']);
        Route::put('/tasks/{task}/comments/{comment}', [\App\Http\Controllers\TaskCommentController::class, 'update']);
        Route::delete('/tasks/{task}/comments/{comment}', [\App\Http\Controllers\TaskCommentController::class, 'destroy']);
        // File comments
        Route::get('/files/{file}/comments', [\App\Http\Controllers\FileCommentController::class, 'index']);
        Route::post('/files/{file}/comments', [\App\Http\Controllers\FileCommentController::class, 'store']);
        Route::put('/files/{file}/comments/{comment}', [\App\Http\Controllers\FileCommentController::class, 'update']);
        Route::delete('/files/{file}/comments/{comment}', [\App\Http\Controllers\FileCommentController::class, 'destroy']);
        // Activities notifications
        Route::get('/activities/notifications', [ActivityController::class, 'notifications']);
    });
});

// Utilisateurs (admin only pour création/édition/suppression)
Route::middleware(['auth'])->group(function () {
    Route::middleware('can:admin-only')->group(function () {
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
    // Liste et détail accessibles à tous les utilisateurs connectés
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

// Routes pour la gestion des établissements scolaires
Route::middleware(['auth'])->group(function () {
    Route::resource('schools', \App\Http\Controllers\SchoolController::class);
    
    // Routes supplémentaires pour les administrateurs
    Route::middleware('can:admin-only')->group(function () {
        Route::get('/schools/{school}/hosts', [\App\Http\Controllers\SchoolController::class, 'indexHosts'])->name('schools.hosts.index');
        Route::post('/schools/{school}/hosts', [\App\Http\Controllers\SchoolController::class, 'addHost'])->name('schools.hosts.add');
        Route::delete('/schools/{school}/hosts/{user}', [\App\Http\Controllers\SchoolController::class, 'removeHost'])->name('schools.hosts.remove');
    });
});

// Rôles (création/suppression)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/roles/create', [\App\Http\Controllers\UserController::class, 'createRole'])->name('roles.create');
    Route::delete('/roles/{id}/delete', [\App\Http\Controllers\UserController::class, 'destroyRole'])->name('roles.destroy');
});

// Fichiers : accès direct à la vue
Route::get('files/{file}', [App\Http\Controllers\FileController::class, 'show'])->name('files.show');

// Route pour exécuter manuellement la file d'attente
Route::get('/run-queue', function () {
    try {
        // Exécuter la commande queue:work avec stop-when-empty
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
})->name('queue.run');

// Pages d'erreur personnalisées
Route::get('/error/403', function () {
    return Inertia::render('Error403');
});
Route::get('/error/404', function () {
    return Inertia::render('Error404');
});
Route::get('/error/500', function () {
    return Inertia::render('Error500');
});

require __DIR__.'/auth.php';
