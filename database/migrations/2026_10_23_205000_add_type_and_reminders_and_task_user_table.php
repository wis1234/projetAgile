<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ajouter le type de tâche et le suivi des rappels envoyés
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'type')) {
                $table->string('type')->default('individual')->after('priority');
            }
            if (!Schema::hasColumn('tasks', 'reminders_sent')) {
                $table->json('reminders_sent')->nullable()->after('deadline_notification_sent_at');
            }
        });

        // 2. Table pivot pour les tâches de groupe (plusieurs membres assignés)
        if (!Schema::hasTable('task_user')) {
            Schema::create('task_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['task_id', 'user_id']);
            });
        }

        // 3. Pré-remplir task_user avec les tâches existantes ayant un assigned_to
        try {
            $existingTasks = DB::table('tasks')
                ->whereNotNull('assigned_to')
                ->select('id', 'assigned_to', 'created_at', 'updated_at')
                ->get();

            $now = now();
            foreach ($existingTasks as $t) {
                DB::table('task_user')->insertOrIgnore([
                    'task_id'    => $t->id,
                    'user_id'    => $t->assigned_to,
                    'created_at' => $t->created_at ?? $now,
                    'updated_at' => $t->updated_at ?? $now,
                ]);
            }
        } catch (\Throwable $e) {
            // Ignorer silencieusement si la table n'est pas encore prête
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_user');

        Schema::table('tasks', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('tasks', 'type')) {
                $columnsToDrop[] = 'type';
            }
            if (Schema::hasColumn('tasks', 'reminders_sent')) {
                $columnsToDrop[] = 'reminders_sent';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
