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
    Schema::table('files', function (Blueprint $table) {
        $table->string('password_hash')->nullable()->after('name');
        $table->boolean('is_password_protected')->default(false)->after('password_hash');
    });
}

public function down()
{
    Schema::table('files', function (Blueprint $table) {
        $table->dropColumn(['password_hash', 'is_password_protected']);
    });
}

};
