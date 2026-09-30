import { useForm, usePage } from '@inertiajs/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { SectionCard, SaveBar } from '@/Components/Profile/ui';
import PushNotificationManager from '@/Components/PushNotificationManager';


const preferenceOptions = [
    {
        key: 'task_updates',
        title: 'Tâches',
        description: 'Assignations, commentaires et rappels d’échéance',
        icon: '🗂️',
    },
    {
        key: 'project_updates',
        title: 'Projets',
        description: 'Mises à jour de projet, ajout de membres et changements importants',
        icon: '🚀',
    },
    {
        key: 'file_updates',
        title: 'Fichiers',
        description: 'Nouveaux fichiers, commentaires et changements de statut',
        icon: '📎',
    },
    {
        key: 'meeting_updates',
        title: 'Réunions',
        description: 'Rappels et notifications liées aux réunions Zoom',
        icon: '🗓️',
    },
    {
        key: 'recruitment_updates',
        title: 'Recrutement',
        description: 'Évolution des candidatures et réponses associées',
        icon: '👥',
    },
    {
        key: 'subscription_updates',
        title: 'Abonnements',
        description: 'Confirmation et mise à jour de votre abonnement',
        icon: '💳',
    },
    {
        key: 'payment_updates',
        title: 'Paiements',
        description: 'Validation des paiements et confirmations de règlement',
        icon: '💸',
    },
    {
        key: 'security_updates',
        title: 'Sécurité et compte',
        description: 'Changements sensibles liés à votre compte et accès',
        icon: '🔐',
    },
];

export default function NotificationPreferencesForm({ notificationPreferences = {} }) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        notification_preferences: notificationPreferences || {},
    });

    const prefs = data.notification_preferences || {};
    const toggle = (key) => setData('notification_preferences', { ...prefs, [key]: !prefs[key] });
    const setAll = (value) =>
        setData('notification_preferences', Object.fromEntries(preferenceOptions.map((o) => [o.key, value])));
    const activeCount = preferenceOptions.filter((o) => prefs[o.key]).length;

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.preferences.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit}>
            <SectionCard
                id="notifications"
                icon={BellIcon}
                title="Notifications"
                description="Choisissez les alertes que vous souhaitez recevoir par e-mail."
                aside={
                    <div className="hidden shrink-0 items-center gap-3 text-xs font-medium md:flex">
                        <span className="text-slate-500 dark:text-slate-400">{activeCount}/{preferenceOptions.length} actives</span>
                        <button type="button" onClick={() => setAll(true)} className="text-blue-600 hover:underline dark:text-blue-300">Tout activer</button>
                        <button type="button" onClick={() => setAll(false)} className="text-slate-500 hover:underline dark:text-slate-400">Tout désactiver</button>
                    </div>
                }
                footer={<SaveBar processing={processing} saved={recentlySuccessful} label="Enregistrer les préférences" note="Modifiable à tout moment." />}
            >
                <div className="mb-4 flex items-center justify-between text-xs font-medium md:hidden">
                    <span className="text-slate-500 dark:text-slate-400">{activeCount}/{preferenceOptions.length} actives</span>
                    <span className="flex gap-4">
                        <button type="button" onClick={() => setAll(true)} className="py-1 text-blue-600 dark:text-blue-300">Tout activer</button>
                        <button type="button" onClick={() => setAll(false)} className="py-1 text-slate-500 dark:text-slate-400">Tout désactiver</button>
                    </span>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
                    {preferenceOptions.map((o) => {
                        const on = Boolean(prefs[o.key]);
                        return (
                            <li key={o.key} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-700/60">{o.icon}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{o.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{o.description}</p>
                                </div>
                                <button
                                    type="button" role="switch" aria-checked={on} aria-label={o.title}
                                    onClick={() => toggle(o.key)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/25 ${on ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <PushNotificationManager />
                </div>
            </SectionCard>
        </form>
    );
}
