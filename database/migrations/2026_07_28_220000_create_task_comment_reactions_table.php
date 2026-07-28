<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('task_comment_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_comment_id')
                  ->constrained('task_comments')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->string('emoji', 10);
            $table->timestamps();

            // Un utilisateur ne peut avoir qu'une seule réaction par commentaire
            $table->unique(['task_comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_comment_reactions');
    }
};
