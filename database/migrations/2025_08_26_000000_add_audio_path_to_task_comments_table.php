<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('task_comments', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('content');
            $table->integer('audio_duration')->nullable()->after('audio_path');
        });
    }

    public function down()
    {
        Schema::table('task_comments', function (Blueprint $table) {
            $table->dropColumn(['audio_path', 'audio_duration']);
        });
    }
};
