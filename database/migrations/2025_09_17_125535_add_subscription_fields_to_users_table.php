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
            $table->foreignId('current_subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->dateTime('subscription_ends_at')->nullable();
            $table->boolean('is_subscribed')->default(false);
            $table->string('subscription_status')->default('inactive'); // inactive, active, cancelled, expired
            $table->string('billing_email')->nullable();
            $table->string('billing_phone')->nullable();
            $table->text('billing_address')->nullable();
            $table->string('billing_city')->nullable();
            $table->string('billing_country')->nullable();
            $table->string('billing_postal_code')->nullable();
            $table->string('tax_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_subscription_id']);
            $table->dropColumn([
                'current_subscription_id',
                'subscription_ends_at',
                'is_subscribed',
                'subscription_status',
                'billing_email',
                'billing_phone',
                'billing_address',
                'billing_city',
                'billing_country',
                'billing_postal_code',
                'tax_id'
            ]);
        });
    }
};
