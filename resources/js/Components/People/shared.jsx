import React from 'react';
import Avatar from '@/Components/Quiz/Avatar';

export { Avatar };

/** Rôles globaux (compte) et rôles de projet, avec libellés FR et couleurs. */
export const GLOBAL_ROLES = {
    admin: { label: 'Administrateur', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
    manager: { label: 'Manager', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300' },
    member: { label: 'Membre', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
    developer: { label: 'Développeur', cls: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300' },
    candidate: { label: 'Candidat', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
    user: { label: 'Utilisateur', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
};
export const PROJECT_ROLES = {
    manager: { label: 'Chef de projet', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
    member: { label: 'Membre', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
    observer: { label: 'Observateur', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
};
export const TASK_STATUS = {
    todo: { label: 'À faire', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200', bar: 'bg-slate-400' },
    in_progress: { label: 'En cours', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', bar: 'bg-blue-500' },
    review: { label: 'En revue', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300', bar: 'bg-purple-500' },
    done: { label: 'Terminée', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-500' },
};
export const statusOf = (s) => TASK_STATUS[s] || { label: (s || '—').replace(/_/g, ' '), cls: TASK_STATUS.todo.cls, bar: 'bg-slate-400' };

export function Badge({ cfg, children, className = '' }) {
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls} ${className}`}>{children ?? cfg.label}</span>;
}

export const fmtDate = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('fr-FR', opts) : '—';

export function timeAgo(d) {
    if (!d) return null;
    const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
    if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`;
    return fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Card({ title, icon: Icon, action, children, className = '' }) {
    return (
        <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}>
            {title && (
                <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-700/70 sm:px-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {Icon && <Icon className="h-4 w-4 text-blue-500" />} {title}
                    </h2>
                    {action}
                </header>
            )}
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

export function Stat({ label, value, tone = 'text-slate-900 dark:text-white' }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
            <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value ?? 0}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

export function ProgressBar({ done = 0, total = 0 }) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">{done}/{total}</span>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, text }) {
    return (
        <div className="py-8 text-center">
            {Icon && <Icon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />}
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{title}</p>
            {text && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>}
        </div>
    );
}

export function InfoRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <div className="break-words text-sm font-medium text-slate-900 dark:text-slate-100">{children}</div>
            </div>
        </div>
    );
}
