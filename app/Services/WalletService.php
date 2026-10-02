<?php

namespace App\Services;

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;

/**
 * Portefeuille d'un utilisateur.
 *
 *   gains validés  = montant des tâches dont le paiement a été VALIDÉ par un manager (task_payments.status = validated)
 *   retenu         = retraits en attente / en cours / terminés (un retrait échoué ou annulé est automatiquement recrédité)
 *   disponible     = gains validés − retenu
 *
 * Le calcul est volontairement centralisé ici : si vos règles de gain changent (bonus, remboursements…),
 * il suffit d'adapter earned().
 */
class WalletService
{
    public function earned(int $userId): float
    {
        return (float) DB::table('task_payments')
            ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
            ->where('task_payments.user_id', $userId)
            ->where('task_payments.status', 'validated')
            ->sum('tasks.amount');
    }

    /** Gains en attente de validation (information, non retirables). */
    public function awaitingValidation(int $userId): float
    {
        return (float) DB::table('task_payments')
            ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
            ->where('task_payments.user_id', $userId)
            ->where('task_payments.status', 'pending')
            ->sum('tasks.amount');
    }

    private function sumWithdrawals(int $userId, array $statuses): float
    {
        return (float) Withdrawal::where('user_id', $userId)->whereIn('status', $statuses)->sum('amount');
    }

    public function summary(int $userId): array
    {
        $earned = $this->earned($userId);
        $completed = $this->sumWithdrawals($userId, [Withdrawal::STATUS_COMPLETED]);
        $inFlight = $this->sumWithdrawals($userId, [Withdrawal::STATUS_PENDING, Withdrawal::STATUS_PROCESSING]);

        return [
            'currency' => 'XOF',
            'earned' => $earned,
            'withdrawn' => $completed,
            'processing' => $inFlight,
            'available' => max(0, $earned - $completed - $inFlight),
            'awaiting_validation' => $this->awaitingValidation($userId),
            'min_withdrawal' => (float) config('services.fedapay.min_withdrawal', 500),
        ];
    }

    public function available(int $userId): float
    {
        return $this->summary($userId)['available'];
    }
}
