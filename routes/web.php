<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\RemunerationController;

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
    // Routes Zoom
    Route::prefix('projects/{project}')->group(function () {
        Route::get('/zoom/active', [\App\Http\Controllers\ZoomMeetingController::class, 'active'])->name('api.zoom.active');
        Route::get('/zoom/recent', [\App\Http\Controllers\ZoomMeetingController::class, 'recent'])->name('api.zoom.recent');
        Route::post('/zoom/meetings', [\App\Http\Controllers\ZoomMeetingController::class, 'store'])->name('api.zoom.store');
        Route::get('/zoom/meetings/{meeting}', [\App\Http\Controllers\ZoomMeetingController::class, 'show'])->name('api.zoom.show');
        Route::put('/zoom/meetings/{meeting}/end', [\App\Http\Controllers\ZoomMeetingController::class, 'end'])->name('api.zoom.end');
    });
    
    // Subscription routes
    Route::get('/subscriptions', [App\Http\Controllers\SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::get('/subscriptions/checkout/{plan}', [App\Http\Controllers\SubscriptionController::class, 'checkout'])->name('subscriptions.checkout');
    Route::post('/subscriptions/subscribe', [App\Http\Controllers\SubscriptionController::class, 'subscribe'])->name('subscriptions.subscribe');
    Route::get('/subscriptions/success', [App\Http\Controllers\SubscriptionController::class, 'success'])->name('subscriptions.success');
    Route::get('/subscriptions/cancel', [App\Http\Controllers\SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
    Route::get('/settings/billing', [App\Http\Controllers\SubscriptionController::class, 'billing'])->name('settings.billing');
    
    // Route de débogage pour les abonnements (à supprimer en production)
    Route::get('/debug/subscriptions', [App\Http\Controllers\SubscriptionController::class, 'debugSubscriptions'])
        ->name('subscriptions.debug')
        ->middleware('auth');
        
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/profile/bank-details', [ProfileController::class, 'showBankDetails'])->name('profile.bank-details');
    Route::put('/profile/bank-details', [ProfileController::class, 'updateBankDetails'])->name('profile.update-bank-details');
    // Routes pour le module de recrutement
    Route::resource('recruitment', App\Http\Controllers\RecruitmentController::class);
    
    // Routes pour les candidatures
    Route::prefix('recruitment/{recruitment}')->group(function () {
        Route::get('applications', [App\Http\Controllers\RecruitmentApplicationController::class, 'index'])
            ->name('recruitment.applications.index');
        Route::get('applications/create', [App\Http\Controllers\RecruitmentApplicationController::class, 'create'])
            ->name('recruitment.applications.create');
        Route::post('applications', [App\Http\Controllers\RecruitmentApplicationController::class, 'store'])
            ->name('recruitment.applications.store');
        
        // Routes pour une candidature spécifique
        // Route pour l'exportation Excel des candidatures
        Route::get('applications/export', [App\Http\Controllers\RecruitmentApplicationController::class, 'export'])
            ->name('recruitment.applications.export');
            
        Route::prefix('applications/{application}')->group(function () {
            Route::get('/', [App\Http\Controllers\RecruitmentApplicationController::class, 'show'])
                ->name('recruitment.applications.show');
            Route::put('status', [App\Http\Controllers\RecruitmentApplicationController::class, 'updateStatus'])
                ->name('recruitment.applications.status');
            Route::get('download', [App\Http\Controllers\RecruitmentApplicationController::class, 'downloadResume'])
                ->name('recruitment.applications.download');
            Route::get('download/{fieldName}', [App\Http\Controllers\RecruitmentApplicationController::class, 'downloadCustomFile'])
                ->name('recruitment.applications.download.custom');
            Route::delete('/', [App\Http\Controllers\RecruitmentApplicationController::class, 'destroy'])
                ->name('recruitment.applications.destroy');
        });
    });
    
    // Routes API pour le recrutement
    Route::prefix('api')->group(function () {
        Route::get('/recruitment/statuses', [\App\Http\Controllers\RecruitmentController::class, 'getStatuses']);
        Route::get('/recruitment/types', [\App\Http\Controllers\RecruitmentController::class, 'getTypes']);
        Route::get('/recruitment/experience-levels', [\App\Http\Controllers\RecruitmentController::class, 'getExperienceLevels']);
        Route::get('/recruitment/education-levels', [\App\Http\Controllers\RecruitmentController::class, 'getEducationLevels']);
    });
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
    
    // Gestion des plans d'abonnement
    Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
        // Routes pour la gestion des plans d'abonnement accessibles à tous les utilisateurs authentifiés
        Route::get('subscription-plans', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'index'])->name('subscription-plans.index');
        Route::get('subscription-plans/create', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'create'])->name('subscription-plans.create');
        Route::post('subscription-plans', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'store'])->name('subscription-plans.store');
        Route::get('subscription-plans/{subscription_plan}/edit', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'edit'])->name('subscription-plans.edit');
        Route::put('subscription-plans/{subscription_plan}', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'update'])->name('subscription-plans.update');
        Route::delete('subscription-plans/{subscription_plan}', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'destroy'])->name('subscription-plans.destroy');
        
        // Subscribers routes
        Route::get('subscription-plans/subscribers', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'subscribers'])->name('subscription-plans.subscribers');
        Route::get('subscription-plans/{subscription_plan}/subscribers', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'subscribers'])->name('subscription-plans.plan-subscribers');
        
        // Update subscription status
        Route::put('subscriptions/{subscription}/update-status', [App\Http\Controllers\Admin\SubscriptionPlanController::class, 'updateStatus'])
            ->name('subscriptions.update-status');
    });
    Route::resource('sprints', App\Http\Controllers\SprintController::class);
    Route::resource('projects', App\Http\Controllers\ProjectController::class);
    Route::resource('files', App\Http\Controllers\FileController::class);
    Route::post('files/{file}/content', [App\Http\Controllers\FileController::class, 'updateContent'])
        ->name('files.update-content');
    Route::resource('messages', App\Http\Controllers\MessageController::class);
    Route::resource('audit-logs', App\Http\Controllers\AuditLogController::class);
    Route::resource('project-users', App\Http\Controllers\ProjectUserController::class);
    
    // Routes personnalisées pour les tâches
    Route::post('/tasks/{task}/payment', [App\Http\Controllers\TaskController::class, 'savePaymentInfo'])->name('tasks.payment.save');
    
    // Route pour la mise en sourdine des membres du projet
    Route::post('/projects/{project}/users/{user}/toggle-mute', [App\Http\Controllers\ProjectUserController::class, 'toggleMute'])
        ->name('project-users.toggle-mute');
    Route::post('/tasks/{task}/payment/validate/{taskPayment}', [App\Http\Controllers\TaskController::class, 'validatePayment'])->name('tasks.payment.validate');
    Route::get('/tasks/{task}/download-receipt', [App\Http\Controllers\TaskController::class, 'downloadReceipt'])->name('tasks.receipt.download');
    
    // Tableau Kanban
    Route::get('/kanban', [App\Http\Controllers\KanbanController::class, 'index'])->name('kanban.index');
    Route::put('/kanban/update-order', [App\Http\Controllers\KanbanController::class, 'updateOrder'])->name('kanban.updateOrder');
    Route::get('/api/kanban/tasks', [App\Http\Controllers\KanbanController::class, 'apiTasks'])->name('kanban.api.tasks');
    
    // Gestion des rémunérations
    Route::get('remunerations/dashboard', [RemunerationController::class, 'dashboard'])->name('remunerations.dashboard');
    Route::resource('remunerations', RemunerationController::class)->except(['create', 'edit']);
    Route::post('remunerations/{remuneration}/mark-as-paid', [RemunerationController::class, 'markAsPaid'])->name('remunerations.mark-as-paid');
    Route::post('remunerations/{remuneration}/cancel', [RemunerationController::class, 'cancel'])->name('remunerations.cancel');
    
    // Gestion des projets
    Route::patch('/projects/{id}/status', [App\Http\Controllers\ProjectController::class, 'changeStatus'])->name('projects.change-status');
    
    // Créer un sprint pour un projet spécifique
    Route::get('/projects/{project}/sprints/create', [App\Http\Controllers\SprintController::class, 'createForProject'])->name('projects.sprints.create');
    Route::get('/projects/{id}/suivi-global/{format?}', [App\Http\Controllers\ProjectController::class, 'generateSuiviGlobal'])
        ->where('format', 'txt|pdf|docx')
        ->defaults('format', 'txt')
        ->name('projects.suivi-global');
    
    // Gestion des fichiers
    Route::get('files/{file}/edit-content', [App\Http\Controllers\FileController::class, 'editContent'])->name('files.edit-content');
    Route::put('files/{file}/content', [App\Http\Controllers\FileController::class, 'updateContent'])->name('files.updateContent');
    Route::get('files/{file}/download', [App\Http\Controllers\FileController::class, 'download'])->name('files.download');
    Route::post('files/download-multiple', [App\Http\Controllers\FileController::class, 'downloadMultiple'])->name('files.downloadMultiple');
    
    // Téléchargement des fichiers de tâches
    Route::get('/tasks/{task}/files/{file}/download', [App\Http\Controllers\TaskController::class, 'downloadFile'])
        ->name('tasks.files.download');
    
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

// User search API endpoint
Route::post('/api/users/search-by-email', [App\Http\Controllers\Api\UserController::class, 'searchByEmail'])
    ->name('api.users.search-by-email');

// Zoom Meeting Routes
Route::middleware(['auth'])->group(function () {
    Route::prefix('api/projects/{project}')->group(function () {
        Route::get('/zoom/active', [App\Http\Controllers\ZoomMeetingController::class, 'active'])->name('api.zoom.active');
        Route::post('/zoom/meetings', [App\Http\Controllers\ZoomMeetingController::class, 'store'])->name('api.zoom.store');
        Route::get('/zoom/meetings/{meeting}', [App\Http\Controllers\ZoomMeetingController::class, 'show'])->name('api.zoom.show');
        Route::put('/zoom/meetings/{meeting}/end', [App\Http\Controllers\ZoomMeetingController::class, 'end'])->name('api.zoom.end');
    });
});

// Webhook FedaPay pour les paiements
Route::post('/webhooks/fedapay', [App\Http\Controllers\WebhookController::class, 'handleFedapayWebhook'])
    ->name('webhooks.fedapay')
    ->withoutMiddleware(['web', 'csrf']);

// Route pour gérer l'erreur 419 (Session expirée)
Route::get('/419', function () {
    if (request()->hasHeader('X-Inertia') || request()->header('X-Inertia')) {
        // Pour les requêtes Inertia, on retourne une réponse JSON spéciale
        return response()->json([
            'component' => 'Error419',
            'props' => [
                'status' => 419,
                'message' => 'Votre session a expiré. Veuillez vous reconnecter.'
            ]
        ], 419);
    }
    
    // Pour les requêtes normales, on redirige vers la page de connexion avec un message
    return redirect()->route('login')
        ->with('error', 'Votre session a expiré. Veuillez vous reconnecter.');
})->name('session.expired');

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

// Rémunérations
Route::middleware(['auth'])->group(function () {
    Route::get('/remunerations', [\App\Http\Controllers\RemunerationController::class, 'index'])->name('remunerations.index');
    Route::get('/remunerations/dashboard', [\App\Http\Controllers\RemunerationController::class, 'dashboard'])->name('remunerations.dashboard');
    Route::get('/remunerations/{remuneration}', [\App\Http\Controllers\RemunerationController::class, 'show'])->name('remunerations.show');
    Route::post('/remunerations/{remuneration}/mark-as-paid', [\App\Http\Controllers\RemunerationController::class, 'markAsPaid'])->name('remunerations.markAsPaid');
    Route::post('/remunerations/{remuneration}/cancel', [\App\Http\Controllers\RemunerationController::class, 'cancel'])->name('remunerations.cancel');
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

// Gestion des abonnements
Route::middleware(['auth', 'verified'])->prefix('subscription')->name('subscription.')->group(function () {
    Route::get('/manage', [\App\Http\Controllers\SubscriptionController::class, 'manage'])->name('manage');
    Route::get('/plans', [\App\Http\Controllers\SubscriptionController::class, 'index'])->name('plans');
    Route::get('/checkout/{id}', [\App\Http\Controllers\SubscriptionController::class, 'checkout'])->name('checkout');
    Route::post('/subscribe/{id}', [\App\Http\Controllers\SubscriptionController::class, 'subscribe'])->name('subscribe');
    Route::get('/success', [\App\Http\Controllers\SubscriptionController::class, 'success'])->name('success');
});

// Fichiers : accès direct à la vue
Route::get('/fichiers', function () {
    return Inertia::render('Files/Index');
})->middleware(['auth', 'verified'])->name('fichiers');

// Route pour exécuter la file d'attente manuellement (protégée par jeton)
Route::get('/run-queue', function () {
    // Journaliser la tentative d'accès
    \Log::info('Tentative d\'accès à /run-queue', [
        'ip' => request()->ip(),
        'user_agent' => request()->userAgent(),
        'authenticated' => auth()->check(),
        'environment' => app()->environment(),
        'token' => request()->query('token')
    ]);

    // Vérifier le jeton d'autorisation
    $validToken = env('QUEUE_WORKER_TOKEN');
    $providedToken = request()->query('token');

    if (!$validToken || $providedToken !== $validToken) {
        \Log::warning('Accès non autorisé à /run-queue - Jeton invalide ou manquant');
        abort(403, 'Accès non autorisé - Jeton invalide ou manquant');
    }

    try {
        // Vérifier si la table jobs existe
        if (!\Schema::hasTable('jobs')) {
            throw new \Exception("La table 'jobs' n'existe pas dans la base de données.");
        }
        
        // Vérifier la connexion à la base de données
        \DB::connection()->getPdo();
        
        // Exécuter la file d'attente avec un délai d'expiration
        $exitCode = \Artisan::call('queue:work', [
            '--stop-when-empty' => true,
            '--tries' => 3,
            '--timeout' => 60,
            '--queue' => 'default',
            '--sleep' => 3,
        ]);
        
        // Récupérer la sortie de la commande
        $output = \Artisan::output();
        
        // Journaliser l'exécution
        \Log::info('File d\'attente exécutée avec succès via /run-queue', [
            'exit_code' => $exitCode,
            'output' => $output,
            'jobs_processed' => trim($output) !== '' ? count(explode("\n", trim($output))) : 0,
            'memory_usage' => memory_get_usage(true) / 1024 / 1024 . 'MB',
            'execution_time' => microtime(true) - LARAVEL_START . 's'
        ]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'File d\'attente traitée avec succès',
            'jobs_processed' => trim($output) !== '' ? count(explode("\n", trim($output))) : 0,
            'memory_usage' => memory_get_usage(true) / 1024 / 1024 . 'MB',
            'execution_time' => microtime(true) - LARAVEL_START . 's'
        ]);
        
    } catch (\PDOException $e) {
        \Log::error('Erreur de connexion à la base de données', [
            'error' => $e->getMessage(),
            'code' => $e->getCode()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Erreur de connexion à la base de données',
            'error' => $e->getMessage(),
            'code' => $e->getCode()
        ], 500);
        
    } catch (\Exception $e) {
        \Log::error('Erreur lors de l\'exécution de la file d\'attente', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'code' => $e->getCode()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Erreur lors du traitement de la file d\'attente',
            'error' => $e->getMessage(),
            'code' => $e->getCode()
        ], 500);
    }
})->name('queue.work');

// Supprimer l'ancienne route /queue/work si elle existe
if (Route::has('queue.work')) {
    Route::get('/queue/work', function () {
        return response()->json([
            'status' => 'moved',
            'message' => 'Cette route a été déplacée vers /run-queue',
            'new_url' => url('/run-queue')
        ], 301);
    });
}

require __DIR__.'/auth.php';
