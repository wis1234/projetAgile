import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import PrimaryButton from '@/Components/PrimaryButton';
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

export default function NotificationPreferencesForm({ notificationPreferences = {}, className = '' }) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        notification_preferences: notificationPreferences,
    });

    const togglePreference = (key) => {
        setData('notification_preferences', {
            ...data.notification_preferences,
            [key]: !data.notification_preferences[key],
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('profile.preferences.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={`w-full ${className}`}>
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border border-blue-100 dark:border-gray-700 rounded-2xl shadow-sm p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200">Préférences de notification</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Choisissez les types de notifications que vous souhaitez recevoir par email.
                        </p>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-200">
                        Personnalisation intelligente
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {preferenceOptions.map((option) => (
                            <label
                                key={option.key}
                                className="group flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 p-4 transition hover:border-blue-300 hover:shadow-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={Boolean(data.notification_preferences?.[option.key])}
                                    onChange={() => togglePreference(option.key)}
                                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{option.icon}</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{option.title}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{option.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Vous pouvez modifier ces préférences à tout moment depuis cette page.
                        </p>
                        <div className="flex items-center gap-3">
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-green-600 dark:text-green-400">Enregistré.</p>
                            </Transition>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Enregistrement...' : 'Enregistrer les préférences'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
                <PushNotificationManager />
                
            </div>
        </section>
    );
}
