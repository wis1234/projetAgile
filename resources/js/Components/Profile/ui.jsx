import { Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export const inputCls =
    'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition ' +
    'focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ' +
    'dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:disabled:bg-slate-800';

export const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ' +
    'hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60';

export const btnGhost =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition ' +
    'hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export const btnDanger =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ' +
    'hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60';

/** Carte de section : en-tête (icône, titre, description) + contenu + pied optionnel. */
export function SectionCard({ id, icon: Icon, title, description, tone = 'blue', children, footer, aside }) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
        red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
    };
    return (
        <section
            id={id}
            className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-800 ${
                tone === 'red' ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
            <header className="flex items-start gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/70">
                {Icon && (
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                </div>
                {aside}
            </header>
            <div className="px-6 py-6">{children}</div>
            {footer && (
                <footer className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-700/70 dark:bg-slate-900/30">
                    {footer}
                </footer>
            )}
        </section>
    );
}

export function Field({ label, htmlFor, hint, error, className = '', children }) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label}
            </label>
            {children}
            {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}

/** Barre d'action : message de succès + bouton. */
export function SaveBar({ processing, saved, label = 'Enregistrer', busyLabel = 'Enregistrement…', note }) {
    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>
            <div className="flex items-center justify-end gap-4">
                <Transition
                    show={!!saved}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    leave="transition ease-in duration-300"
                    leaveTo="opacity-0"
                >
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon className="h-5 w-5" /> Enregistré
                    </span>
                </Transition>
                <button type="submit" disabled={processing} className={btnPrimary}>
                    {processing ? busyLabel : label}
                </button>
            </div>
        </div>
    );
}
