import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { FaHome, FaArrowLeft, FaRedo } from 'react-icons/fa';

/**
 * Écran d'erreur autonome (sans AdminLayout) : s'affiche même hors session ou si le layout échoue,
 * ce qui évite les chargements sans fin et les pages blanches.
 */
export default function ErrorScreen({ code, title, text, icon: Icon, tone = 'blue', retry = false }) {
    const tones = {
        blue: ['from-blue-600 via-blue-700 to-indigo-700', 'text-blue-600 dark:text-blue-300', 'bg-blue-600 hover:bg-blue-700'],
        red: ['from-rose-600 via-red-600 to-red-700', 'text-red-600 dark:text-red-300', 'bg-red-600 hover:bg-red-700'],
        orange: ['from-orange-500 via-orange-600 to-amber-600', 'text-orange-600 dark:text-orange-300', 'bg-orange-600 hover:bg-orange-700'],
    }[tone];
    const back = () => (window.history.length > 1 ? window.history.back() : window.location.assign('/'));

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-900">
            <Head title={`${code} · ${title}`} />
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className={`relative bg-gradient-to-br ${tones[0]} px-6 pb-12 pt-10 text-white`}>
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
                    <Icon className="relative mx-auto h-10 w-10 opacity-90" />
                    <p className="relative mt-3 text-7xl font-black tracking-tight">{code}</p>
                </div>
                <div className="-mt-6 rounded-t-3xl bg-white px-6 pb-8 pt-8 dark:bg-slate-800">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link href="/" className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm ${tones[2]}`}>
                            <FaHome /> Accueil
                        </Link>
                        <button type="button" onClick={back} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            <FaArrowLeft /> Retour
                        </button>
                        {retry && (
                            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                <FaRedo /> Réessayer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
