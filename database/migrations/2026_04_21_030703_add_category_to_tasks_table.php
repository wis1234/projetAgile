<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->enum('category', ['individual', 'group'])
              ->default('individual')
              ->after('title');
    });

    // Table pivot pour les assignés multiples (tâches de groupe)
    Schema::create('task_assignees', function (Blueprint $table) {
        $table->id();
        $table->foreignId('task_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
        $table->unique(['task_id', 'user_id']);
    });
}

public function down()
{
    Schema::dropIfExists('task_assignees');
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropColumn('category');
    });
}

};
