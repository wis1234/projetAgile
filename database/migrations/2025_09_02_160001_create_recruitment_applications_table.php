<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('recruitment_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('cover_letter')->nullable();
            $table->string('resume_path');
            $table->string('status')->default('pending'); // pending, reviewed, interviewed, accepted, rejected
            $table->text('notes')->nullable();
            $table->json('custom_fields')->nullable();
            $table->string('source')->nullable(); // site web, LinkedIn, etc.
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('recruitment_applications');
    }
};
