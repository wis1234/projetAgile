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
            $table->boolean('is_paid')->default(false)->after('status');
            $table->string('payment_reason')->nullable()->after('is_paid');
            $table->decimal('amount', 10, 2)->nullable()->after('payment_reason');
            $table->string('payment_status')->default('unpaid')->after('amount');
            $table->timestamp('paid_at')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'is_paid',
                'payment_reason',
                'amount',
                'payment_status',
                'paid_at'
            ]);
        });
    }
};
