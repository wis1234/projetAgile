import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaEnvelopeOpenText, FaExclamationTriangle, FaSpinner, FaRedo, FaSignInAlt } from 'react-icons/fa';
import useCooldown from '@/hooks/useCooldown';
import toast from '@/lib/toast';

const WEBMAIL = { 'gmail.com': ['Ouvrir Gmail', 'https://mail.google.com/'], 'outlook.com': ['Ouvrir Outlook', 'https://outlook.live.com/mail/'], 'hotmail.com': ['Ouvrir Outlook', 'https://outlook.live.com/mail/'], 'yahoo.com': ['Ouvrir Yahoo Mail', 'https://mail.yahoo.com/'], 'yahoo.fr': ['Ouvrir Yahoo Mail', 'https://mail.yahoo.com/'] };

export default function MobileRegisterSuccess({ email, emailSent = true, role = 'user' }) {
  const cooldown = useCooldown(emailSent ? 45 : 0);
  const [sending, setSending] = useState(false);
  const webmail = WEBMAIL[(email.split('@')[1] || '').toLowerCase()];
  const resend = () => { if (sending || cooldown.active) return; router.post(route('register.resend'), {}, { preserveScroll: true, preserveState: true, onStart: () => setSending(true), onSuccess: () => cooldown.start(60), onError: () => toast.error("L'e-mail n'a pas pu être renvoyé."), onFinish: () => setSending(false) }); };

  return (
    <div className={`min-h-[100dvh] ${emailSent ? 'bg-gradient-to-b from-blue-600 to-indigo-800' : 'bg-gradient-to-b from-amber-500 to-orange-700'}`} style={{ paddingTop: 'var(--safe-top)' }}>
      <Head title="Compte créé" />
      <div className="px-6 pb-8 pt-14 text-center text-white">
        <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl">{emailSent ? <FaEnvelopeOpenText /> : <FaExclamationTriangle />}</span>
        <h1 className="text-2xl font-black">{emailSent ? 'Vérifiez votre boîte mail' : 'Compte créé, e-mail non envoyé'}</h1>
        <p className="mt-2 text-sm text-white/85">{emailSent ? 'Un lien d’activation a été envoyé à' : 'Nous n’avons pas pu envoyer l’e-mail à'}<br /><b className="break-all text-base">{email}</b></p>
      </div>
      <div className="space-y-4 rounded-t-[32px] bg-slate-50 px-5 pt-7 dark:bg-slate-950" style={{ paddingBottom: 'calc(2rem + var(--safe-bottom))', minHeight: '55dvh' }}>
        {emailSent && <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          {['Ouvrez le message « Vérifiez votre adresse email ».', 'Touchez le bouton de vérification (valable 60 minutes).', role === 'candidate' ? 'Connectez-vous : vos quiz vous attendent.' : 'Revenez vous connecter : votre compte est prêt.'].map((s, i) => <li key={s} className="flex items-start gap-3"><span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">{i + 1}</span><span className="pt-0.5">{s}</span></li>)}
        </ol>}
        {webmail && emailSent && <a href={webmail[1]} target="_blank" rel="noopener noreferrer" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 active:scale-[.98]"><FaEnvelopeOpenText /> {webmail[0]}</a>}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-bold text-slate-800 dark:text-slate-100">Vous ne voyez rien ?</p>
          <p className="mt-1 text-slate-500">Regardez dans vos courriers indésirables, patientez une minute, ou renvoyez le lien.</p>
          <button type="button" onClick={resend} disabled={sending || cooldown.active} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-600 font-bold text-blue-600 active:scale-[.98] disabled:border-slate-300 disabled:text-slate-400">
            {sending ? <FaSpinner className="animate-spin" /> : <FaRedo />}{sending ? 'Envoi en cours…' : cooldown.active ? `Renvoyer (${cooldown.seconds} s)` : "Renvoyer l'e-mail"}
          </button>
        </div>
        <Link href={route('login')} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-base font-extrabold text-white active:scale-[.98] dark:bg-white dark:text-slate-900"><FaSignInAlt /> Aller à la connexion</Link>
        <Link href={route('register')} className="block text-center text-sm text-slate-500 underline">Mauvaise adresse ? Recommencer</Link>
      </div>
    </div>
  );
}
