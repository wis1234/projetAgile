import React, { useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { FaWallet, FaArrowDown, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaTimes, FaMobileAlt, FaExclamationCircle } from 'react-icons/fa';
import Modal from '@/Components/Modal';

export const fcfa = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`;

const OPERATORS = [
  { id: 'mtn', label: 'MTN MoMo', color: 'bg-yellow-400 text-yellow-950' },
  { id: 'moov', label: 'Moov Money', color: 'bg-sky-500 text-white' },
  { id: 'celtis', label: 'Celtis Cash', color: 'bg-emerald-500 text-white' },
];

export const WITHDRAWAL_STATUS = {
  pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: FaClock },
  processing: { label: 'En cours', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', icon: FaSpinner },
  completed: { label: 'Effectué', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', icon: FaCheckCircle },
  failed: { label: 'Échoué', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', icon: FaTimesCircle },
  cancelled: { label: 'Annulé', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: FaTimes },
};

/** Carte « Mon solde » + modale de retrait Fedapay. */
export default function WalletCard({ wallet, defaults = {} }) {
  const [open, setOpen] = useState(false);
  const canWithdraw = wallet.available >= wallet.min_withdrawal;

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-400/20" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-blue-100"><FaWallet /> Solde disponible</p>
            <p className="mt-2 text-4xl font-extrabold tabular-nums sm:text-5xl">{Math.round(wallet.available).toLocaleString('fr-FR')} <span className="text-xl font-bold text-blue-200">FCFA</span></p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
              <span>Gagné : <b className="text-white">{fcfa(wallet.earned)}</b></span>
              <span>Déjà retiré : <b className="text-white">{fcfa(wallet.withdrawn)}</b></span>
              {wallet.processing > 0 && <span>En cours : <b className="text-white">{fcfa(wallet.processing)}</b></span>}
              {wallet.awaiting_validation > 0 && <span>À valider : <b className="text-white">{fcfa(wallet.awaiting_validation)}</b></span>}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={!canWithdraw}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaArrowDown /> Retirer mes gains
            </button>
            {!canWithdraw && <p className="text-center text-xs text-blue-100 md:text-right">Minimum de retrait : {fcfa(wallet.min_withdrawal)}</p>}
          </div>
        </div>
      </section>

      <WithdrawModal show={open} onClose={() => setOpen(false)} wallet={wallet} defaults={defaults} />
    </>
  );
}

function WithdrawModal({ show, onClose, wallet, defaults }) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    amount: '',
    method: defaults.method || 'mtn',
    phone_number: defaults.phone || '',
  });

  const amount = parseInt(data.amount || 0, 10) || 0;
  const tooMuch = amount > wallet.available;
  const tooLow = amount > 0 && amount < wallet.min_withdrawal;
  const quick = useMemo(() => {
    const a = Math.floor(wallet.available);
    return [...new Set([Math.floor(a / 4), Math.floor(a / 2), a])].filter((v) => v >= wallet.min_withdrawal);
  }, [wallet]);

  const close = () => { reset(); clearErrors(); onClose(); };
  const submit = (e) => {
    e.preventDefault();
    post(route('withdrawals.store'), { preserveScroll: true, onSuccess: close });
  };
  const valid = amount >= wallet.min_withdrawal && !tooMuch && data.phone_number.replace(/\D/g, '').length >= 8;

  return (
    <Modal show={show} onClose={close} maxWidth="md">
      <form onSubmit={submit} className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Retirer mes gains</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Disponible : <b className="text-gray-800 dark:text-gray-100">{fcfa(wallet.available)}</b></p>
          </div>
          <button type="button" onClick={close} aria-label="Fermer" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><FaTimes /></button>
        </div>

        <div className="mt-5">
          <label htmlFor="wd-amount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Montant à retirer</label>
          <div className="relative">
            <input
              id="wd-amount" type="number" inputMode="numeric" min={wallet.min_withdrawal} max={Math.floor(wallet.available)} step="1"
              value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="0"
              className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-4 pr-20 text-2xl font-bold tabular-nums text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">FCFA</span>
          </div>
          {quick.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {quick.map((v) => (
                <button key={v} type="button" onClick={() => setData('amount', String(v))}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {v === Math.floor(wallet.available) ? 'Tout' : v.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>
          )}
          {(errors.amount || tooMuch || tooLow) && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"><FaExclamationCircle />
              {errors.amount || (tooMuch ? 'Montant supérieur à votre solde disponible.' : `Minimum ${fcfa(wallet.min_withdrawal)}.`)}
            </p>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">Recevoir sur</p>
          <div className="grid grid-cols-3 gap-2">
            {OPERATORS.map((o) => (
              <button key={o.id} type="button" onClick={() => setData('method', o.id)} aria-pressed={data.method === o.id}
                className={`rounded-xl border-2 px-2 py-3 text-xs font-bold transition ${data.method === o.id ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'}`}>
                <span className={`mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full ${o.color}`}><FaMobileAlt className="text-xs" /></span>
                {o.label}
              </button>
            ))}
          </div>
          {errors.method && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.method}</p>}
        </div>

        <div className="mt-5">
          <label htmlFor="wd-phone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Numéro Mobile Money</label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-800">+229</span>
            <input id="wd-phone" type="tel" inputMode="tel" value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} placeholder="97 00 00 00" autoComplete="tel-national"
              className="w-full rounded-r-xl border border-gray-300 bg-white px-3.5 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white" />
          </div>
          {errors.phone_number && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone_number}</p>}
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Le numéro doit être enregistré à votre nom chez l'opérateur.</p>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-3.5 text-sm dark:bg-gray-900/40">
          <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Montant demandé</span><b>{fcfa(amount)}</b></div>
          <div className="mt-1 flex justify-between text-gray-600 dark:text-gray-300"><span>Frais</span><b>0 FCFA</b></div>
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Vous recevrez</span><span>{fcfa(amount)}</span></div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
          <button type="submit" disabled={!valid || processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {processing ? <><FaSpinner className="animate-spin" /> Envoi…</> : 'Confirmer le retrait'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Historique des retraits, avec annulation tant que la demande n'est pas partie. */
export function WithdrawalHistory({ withdrawals = [] }) {
  const [busy, setBusy] = useState(null);
  const OP = { mtn: 'MTN MoMo', moov: 'Moov Money', celtis: 'Celtis Cash' };
  const cancel = (w) => {
    if (!window.confirm('Annuler cette demande de retrait ?')) return;
    setBusy(w.id);
    router.post(route('withdrawals.cancel', w.id), {}, { preserveScroll: true, onFinish: () => setBusy(null) });
  };

  if (!withdrawals.length) {
    return (
      <div className="py-10 text-center">
        <FaWallet className="mx-auto text-3xl text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Aucun retrait pour le moment</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vos retraits apparaîtront ici avec leur statut.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700/70">
      {withdrawals.map((w) => {
        const st = WITHDRAWAL_STATUS[w.status] || WITHDRAWAL_STATUS.pending;
        const Icon = st.icon;
        return (
          <li key={w.id} className="flex items-center gap-3 py-3.5">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${st.cls}`}><Icon className={w.status === 'processing' ? 'animate-spin' : ''} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{fcfa(w.amount)}</p>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {OP[w.method] || w.method} · {w.phone_masked} · {new Date(w.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-gray-400">{w.reference}</p>
              {w.status === 'failed' && w.failure_reason && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{w.failure_reason} Le montant a été recrédité.</p>}
            </div>
            {w.can_cancel && (
              <button type="button" onClick={() => cancel(w)} disabled={busy === w.id} className="flex-shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10">Annuler</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
