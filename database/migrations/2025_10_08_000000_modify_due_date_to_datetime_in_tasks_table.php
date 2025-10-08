<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ModifyDueDateToDatetimeInTasksTable extends Migration
{
    public function up()
    {
        // Pour MySQL
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tasks MODIFY due_date DATETIME NULL");
        }
        // Pour PostgreSQL
        elseif (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tasks ALTER COLUMN due_date TYPE TIMESTAMP WITHOUT TIME ZONE USING due_date::timestamp without time zone');
        }
        // Pour SQLite
        elseif (DB::getDriverName() === 'sqlite') {
            // SQLite nécessite de créer une nouvelle table, copier les données, supprimer l'ancienne et renommer la nouvelle
            Schema::create('tasks_temp', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->dateTime('due_date')->nullable();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
                $table->string('status')->default('pending');
                $table->integer('priority')->default(1);
                $table->timestamp('deadline_notification_sent_at')->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO tasks_temp (id, title, description, due_date, project_id, assigned_to, status, priority, created_at, updated_at, deadline_notification_sent_at) SELECT id, title, description, due_date, project_id, assigned_to, status, priority, created_at, updated_at, deadline_notification_sent_at FROM tasks');
            
            Schema::drop('tasks');
            Schema::rename('tasks_temp', 'tasks');
        }
    }

    public function down()
    {
        // Pour MySQL
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tasks MODIFY due_date DATE NULL");
        }
        // Pour PostgreSQL
        elseif (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tasks ALTER COLUMN due_date TYPE DATE USING due_date::date');
        }
        // Pour SQLite (similaire à la méthode up mais en sens inverse)
        elseif (DB::getDriverName() === 'sqlite') {
            Schema::create('tasks_temp', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('due_date')->nullable();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
                $table->string('status')->default('pending');
                $table->integer('priority')->default(1);
                $table->timestamp('deadline_notification_sent_at')->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO tasks_temp (id, title, description, due_date, project_id, assigned_to, status, priority, created_at, updated_at, deadline_notification_sent_at) SELECT id, title, description, date(due_date), project_id, assigned_to, status, priority, created_at, updated_at, deadline_notification_sent_at FROM tasks');
            
            Schema::drop('tasks');
            Schema::rename('tasks_temp', 'tasks');
        }
    }
}
