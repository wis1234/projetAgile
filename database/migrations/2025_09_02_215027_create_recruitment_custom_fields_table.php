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
        Schema::create('recruitment_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_id')->constrained()->onDelete('cascade');
            $table->string('field_name');
            $table->string('field_label');
            $table->enum('field_type', ['text', 'textarea', 'number', 'email', 'tel', 'date', 'select', 'checkbox', 'radio', 'file']);
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable()->comment('Pour les champs de type select, checkbox, radio');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('recruitment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('recruitment_custom_fields');
    }
};
