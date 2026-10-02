<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 32)->unique();          // WD-XXXXXXXXXX (visible par l'utilisateur)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);                   // montant retiré du solde
            $table->decimal('fee', 12, 2)->default(0);          // frais éventuels
            $table->string('currency', 3)->default('XOF');
            $table->string('method', 16);                       // mtn | moov | celtis
            $table->string('phone_number', 24);                 // format international (+229…)
            $table->string('country', 2)->default('bj');
            // pending → processing → completed | failed | cancelled
            $table->string('status', 16)->default('pending')->index();
            $table->string('fedapay_payout_id')->nullable()->index();
            $table->string('fedapay_status')->nullable();
            $table->text('failure_reason')->nullable();
            $table->unsignedSmallInteger('checks')->default(0); // nombre de vérifications de statut
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
