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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, active, cancelled, expired
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->string('payment_id')->nullable(); // ID de paiement FedaPay
            $table->string('payment_method')->nullable(); // Méthode de paiement
            $table->decimal('amount_paid', 10, 2)->nullable(); // Montant payé
            $table->string('currency', 3)->default('XOF');
            $table->text('payment_details')->nullable(); // Détails du paiement (JSON)
            $table->text('receipt_url')->nullable(); // URL du reçu
            $table->boolean('is_renewal')->default(false);
            $table->timestamps();
            
            // Index pour les requêtes fréquentes
            $table->index(['user_id', 'status', 'ends_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
