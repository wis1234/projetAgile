import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaEnvelopeOpenText, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaRedo, FaSignInAlt } from 'react-icons/fa';
import AuthShell from '@/Components/AuthShell';
import useCooldown from '@/hooks/useCooldown';
import useToast from '@/hooks/useToast';

// Accès direct à la boîte mail pour les fournisseurs les plus courants
const WEBMAIL = {
    'gmail.com': { label: 'Ouvrir Gmail', url: 'https://mail.google.com/' },
    'googlemail.com': { label: 'Ouvrir Gmail', url: 'https://mail.google.com/' },
    'outlook.com': { label: 'Ouvrir Outlook', url: 'https://outlook.live.com/mail/' },
    'hotmail.com': { label: 'Ouvrir Outlook', url: 'https://outlook.live.com/mail/' },
    'live.com': { label: 'Ouvrir Outlook', url: 'https://outlook.live.com/mail/' },
    'yahoo.com': { label: 'Ouvrir Yahoo Mail', url: 'https://mail.yahoo.com/' },
    'yahoo.fr': { label: 'Ouvrir Yahoo Mail', url: 'https://mail.yahoo.com/' },
};

export default function RegisterSuccess({ email, emailSent = true }) {
    const toast = useToast();
    const cooldown = useCooldown(emailSent ? 45 : 0);
    const [sending, setSending] = useState(false);
    const webmail = WEBMAIL[(email.split('@')[1] || '').toLowerCase()];

    const resend = () => {
        if (sending || cooldown.active) return;

        router.post(route('register.resend'), {}, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setSending(true),
            onSuccess: () => cooldown.start(60),
            onError: () => toast.error("L'e-mail n'a pas pu être renvoyé. Réessayez dans un instant."),
            onFinish: () => setSending(false),
        });
    };

    return (
        <AuthShell
            headerAction={
                <Link
                    href={route('login')}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300"
                >
                    Se connecter
                </Link>
            }
        >
            <Head title="Compte créé" />

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-900">
                <div className={`px-8 py-8 text-center text-white ${emailSent ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">
                        {emailSent ? <FaEnvelopeOpenText /> : <FaExclamationTriangle />}
                    </div>
                    <h1 className="text-2xl font-bold">
                        {emailSent ? 'Vérifiez votre boîte mail' : 'Compte créé, e-mail non envoyé'}
                    </h1>
                    <p className="mt-2 text-sm text-white/90">
                        {emailSent ? (
                            <>
                                Un lien d&apos;activation a été envoyé à
                                <br />
                                <strong className="break-all text-base">{email}</strong>
                            </>
                        ) : (
                            <>Votre compte pour <strong className="break-all">{email}</strong> existe bien, mais nous n&apos;avons pas pu envoyer l&apos;e-mail de vérification.</>
                        )}
                    </p>
                </div>

                <div className="space-y-6 p-8">
                    {emailSent ? (
                        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                            {[
                                'Ouvrez le message « Vérifiez votre adresse email ».',
                                'Cliquez sur le bouton de vérification (le lien est valable 60 minutes).',
                                'Revenez vous connecter : votre compte est prêt.',
                            ].map((step, i) => (
                                <li key={step} className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        {i + 1}
                                    </span>
                                    <span className="pt-0.5">{step}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                            Cliquez sur « Renvoyer l&apos;e-mail ». Si le problème persiste, connectez-vous : nous vous proposerons de renvoyer le lien depuis votre compte.
                        </p>
                    )}

                    {webmail && emailSent && (
                        <a
                            href={webmail.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800"
                        >
                            <FaEnvelopeOpenText /> {webmail.label}
                        </a>
                    )}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/60">
                        <p className="font-medium text-gray-800 dark:text-gray-200">Vous ne voyez rien ?</p>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Regardez dans vos courriers indésirables (spam) et patientez une minute. Sinon, renvoyez le lien.
                        </p>
                        <button
                            type="button"
                            onClick={resend}
                            disabled={sending || cooldown.active}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent dark:hover:bg-blue-900/20"
                        >
                            {sending ? <FaSpinner className="animate-spin" /> : <FaRedo />}
                            {sending
                                ? 'Envoi en cours…'
                                : cooldown.active
                                ? `Renvoyer l'e-mail (${cooldown.seconds} s)`
                                : "Renvoyer l'e-mail"}
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 text-sm dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                        <Link href={route('register')} className="text-gray-500 underline hover:text-gray-700 dark:text-gray-400">
                            Mauvaise adresse ? Recommencer
                        </Link>
                        <Link
                            href={route('login')}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                        >
                            <FaSignInAlt /> Aller à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
