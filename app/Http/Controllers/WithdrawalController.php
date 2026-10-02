<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWithdrawal;
use App\Models\Withdrawal;
use App\Services\FedapayPayoutService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WithdrawalController extends Controller
{
    public function __construct(private WalletService $wallet)
    {
    }

    /** Demande de retrait : valide, retient le montant (transaction + verrou) puis envoie à Fedapay. */
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:' . (int) config('services.fedapay.min_withdrawal', 500)],
            'method' => ['required', 'in:mtn,moov,celtis'],
            'phone_number' => ['required', 'string', 'max:24'],
        ], [
            'amount.required' => 'Indiquez le montant à retirer.',
            'amount.integer' => 'Le montant doit être un nombre entier de FCFA.',
            'amount.min' => 'Le montant minimum de retrait est de :min FCFA.',
            'method.in' => 'Choisissez un opérateur valide.',
        ]);

        $phone = FedapayPayoutService::normalizePhone($data['phone_number']);
        if (!$phone) {
            throw ValidationException::withMessages(['phone_number' => 'Numéro invalide. Exemple : 97 00 00 00.']);
        }

        $withdrawal = DB::transaction(function () use ($user, $data, $phone) {
            // Verrou : deux demandes simultanées ne peuvent pas dépenser deux fois le même solde
            DB::table('users')->where('id', $user->id)->lockForUpdate()->first();

            $available = $this->wallet->available($user->id);
            if ($data['amount'] > $available) {
                throw ValidationException::withMessages([
                    'amount' => 'Solde insuffisant. Disponible : ' . number_format($available, 0, ',', ' ') . ' FCFA.',
                ]);
            }

            return Withdrawal::create([
                'user_id' => $user->id,
                'amount' => $data['amount'],
                'fee' => 0,
                'currency' => 'XOF',
                'method' => $data['method'],
                'phone_number' => $phone,
                'country' => config('services.fedapay.payout_country', 'bj'),
                'status' => Withdrawal::STATUS_PENDING,
            ]);
        });

        ProcessWithdrawal::dispatch($withdrawal)->afterCommit();

        return back()->with('success', "Demande de retrait {$withdrawal->reference} enregistrée. Vous serez notifié dès que l'opérateur aura traité le transfert.");
    }

    /** Annulation possible tant que la demande n'est pas partie chez Fedapay. */
    public function cancel(Request $request, Withdrawal $withdrawal)
    {
        abort_unless((int) $withdrawal->user_id === (int) $request->user()->id, 403);

        $cancelled = DB::transaction(function () use ($withdrawal) {
            $w = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->first();
            if ($w->status !== Withdrawal::STATUS_PENDING || $w->fedapay_payout_id) {
                return false;
            }
            $w->update(['status' => Withdrawal::STATUS_CANCELLED, 'processed_at' => now()]);
            return true;
        });

        return back()->with(
            $cancelled ? 'success' : 'error',
            $cancelled ? 'Retrait annulé : le montant est de nouveau disponible.' : "Ce retrait est déjà en cours de traitement, il ne peut plus être annulé."
        );
    }
}
