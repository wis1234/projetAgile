import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaEnvelopeOpenText, FaRedo, FaSpinner, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import useCooldown from '@/hooks/useCooldown';
import toast from '@/lib/toast';

export default function MobileVerifyEmail({ status }) {
  const { auth } = usePage().props;
  const cooldown = useCooldown(0);
  const [sending, setSending] = useState(false);
  const resend = () => { if (sending || cooldown.active) return; router.post(route('verification.send'), {}, { preserveScroll: true, onStart: () => setSending(true), onSuccess: () => cooldown.start(60), onError: () => toast.error("L'e-mail n'a pas pu être renvoyé."), onFinish: () => setSending(false) }); };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-600 to-indigo-800" style={{ paddingTop: 'var(--safe-top)' }}>
      <Head title="Vérification de l'adresse email" />
      <div className="px-6 pb-8 pt-14 text-center text-white">
        <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl"><FaEnvelopeOpenText /></span>
        <h1 className="text-2xl font-black">Confirmez votre adresse email</h1>
        <p className="mt-2 text-sm text-white/85">Une dernière étape avant d&apos;accéder à PROJA.</p>
      </div>
      <div className="space-y-4 rounded-t-[32px] bg-slate-50 px-5 pt-7 dark:bg-slate-950" style={{ paddingBottom: 'calc(2rem + var(--safe-bottom))', minHeight: '55dvh' }}>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">Touchez le lien envoyé{auth?.user?.email && <> à <b className="break-all">{auth.user.email}</b></>}. Pas reçu ? Vérifiez vos courriers indésirables puis demandez un nouveau lien.</p>
        {status === 'verification-link-sent' && <p role="status" className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><FaCheckCircle className="mt-0.5 flex-shrink-0" /> Un nouveau lien vient d&apos;être envoyé.</p>}
        <button type="button" onClick={resend} disabled={sending || cooldown.active} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 active:scale-[.98] disabled:opacity-60">
          {sending ? <FaSpinner className="animate-spin" /> : <FaRedo />}{sending ? 'Envoi en cours…' : cooldown.active ? `Renvoyer le lien (${cooldown.seconds} s)` : "Renvoyer l'e-mail de vérification"}
        </button>
        <Link href={route('logout')} method="post" as="button" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 font-bold text-slate-600 active:scale-[.98] dark:border-slate-700 dark:text-slate-300"><FaSignOutAlt /> Se déconnecter</Link>
      </div>
    </div>
  );
}
