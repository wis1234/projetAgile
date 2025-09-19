<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('tax_id');
            $table->string('account_holder_name')->nullable()->after('bank_name');
            $table->string('account_number')->nullable()->after('account_holder_name');
            $table->string('iban', 34)->nullable()->after('account_number');
            $table->string('swift_code', 11)->nullable()->after('iban');
            $table->timestamp('bank_details_verified_at')->nullable()->after('swift_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'account_holder_name',
                'account_number',
                'iban',
                'swift_code',
                'bank_details_verified_at'
            ]);
        });
    }
};
