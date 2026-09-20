import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaEnvelopeOpenText, FaRedo, FaSpinner, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import AuthShell from '@/Components/AuthShell';
import useCooldown from '@/hooks/useCooldown';
import useToast from '@/hooks/useToast';

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const toast = useToast();
    const cooldown = useCooldown(0);
    const [sending, setSending] = useState(false);
    const email = auth?.user?.email;
    const justSent = status === 'verification-link-sent';

    const resend = () => {
        if (sending || cooldown.active) return;

        router.post(route('verification.send'), {}, {
            preserveScroll: true,
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
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-300"
                >
                    <FaSignOutAlt /> Se déconnecter
                </Link>
            }
        >
            <Head title="Vérification de l'adresse email" />

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-900">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-8 text-center text-white">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">
                        <FaEnvelopeOpenText />
                    </div>
                    <h1 className="text-2xl font-bold">Confirmez votre adresse email</h1>
                    <p className="mt-2 text-sm text-white/90">
                        Une dernière étape avant d&apos;accéder à PROJA.
                    </p>
                </div>

                <div className="space-y-5 p-8">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        Cliquez sur le lien que nous avons envoyé
                        {email ? (
                            <> à <strong className="break-all">{email}</strong></>
                        ) : null}
                        . Vous ne l&apos;avez pas reçu ? Vérifiez vos courriers indésirables, puis demandez un nouveau lien.
                    </p>

                    {justSent && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300" role="status">
                            <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                            Un nouveau lien de vérification vient d&apos;être envoyé à votre adresse email.
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={resend}
                        disabled={sending || cooldown.active}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {sending ? <FaSpinner className="animate-spin" /> : <FaRedo />}
                        {sending
                            ? 'Envoi en cours…'
                            : cooldown.active
                            ? `Renvoyer le lien (${cooldown.seconds} s)`
                            : "Renvoyer l'e-mail de vérification"}
                    </button>
                </div>
            </div>
        </AuthShell>
    );
}
