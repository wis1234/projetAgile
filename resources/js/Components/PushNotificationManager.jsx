import { useEffect, useState } from 'react';

/**
 * Convertit une clé VAPID base64url en Uint8Array
 * (requis par l'API pushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Récupère un jeton CSRF frais juste avant l'envoi de la requête,
 * plutôt que de réutiliser celui (potentiellement périmé) du <meta>
 * chargé au démarrage de la page.
 */
async function getFreshCsrfToken() {
    const res = await fetch('/csrf-token', { credentials: 'same-origin' });
    if (!res.ok) {
        throw new Error(`[Push] Impossible de récupérer un jeton CSRF frais (${res.status})`);
    }
    const data = await res.json();
    return data.token;
}

/**
 * Envoie l'abonnement push au backend pour qu'il puisse
 * ensuite déclencher des notifications côté serveur.
 */
async function saveSubscription(subscription) {
    const csrfToken = await getFreshCsrfToken();

    const response = await fetch('/push/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify(subscription.toJSON()),
    });

    if (response.status === 419) {
        // Session expirée entre-temps : on recharge pour repartir sur une session propre
        console.warn('[Push] Session expirée (419), rechargement de la page...');
        window.location.reload();
        return null;
    }

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`[Push] Échec de l'enregistrement de l'abonnement (${response.status}) ${text}`);
    }

    return response.json().catch(() => null);
}

export default function PushNotificationManager({ variant = 'floating' }) {
    const [status, setStatus] = useState('idle'); // idle | requesting | subscribed | denied | unsupported

    useEffect(() => {
        // Vérifie la compatibilité du navigateur
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            console.warn('[Push] Navigateur non compatible avec Web Push');
            return;
        }

        // Si déjà refusé par l'utilisateur, ne pas re-demander
        if (Notification.permission === 'denied') {
            setStatus('denied');
            return;
        }

        // Si déjà accordé, juste s'assurer que le SW est enregistré
        if (Notification.permission === 'granted') {
            registerAndSubscribe();
        }
    }, []);

    async function registerAndSubscribe() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            await navigator.serviceWorker.ready;

            console.log('[Push] Service Worker enregistré');

            const existingSubscription = await registration.pushManager.getSubscription();

            if (existingSubscription) {
                await saveSubscription(existingSubscription);
                setStatus('subscribed');
                console.log('[Push] Abonnement existant synchronisé');
                return;
            }

            const vapidMeta = document.querySelector('meta[name="vapid-public-key"]');

            if (!vapidMeta) {
                console.error('[Push] Clé VAPID absente');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidMeta.content),
            });

            await saveSubscription(subscription);

            setStatus('subscribed');

            console.log('[Push] Nouvel abonnement enregistré');
        } catch (error) {
            console.error('[Push] Erreur:', error);
        }
    }

    async function requestPermission() {
        setStatus('requesting');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            await registerAndSubscribe();
        } else {
            setStatus('denied');
        }
    }

    const bellIcon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
        </svg>
    );

    // ── Mode "floating" (bannière flottante, comportement d'origine) ──
    if (variant === 'floating') {
        // Rien à afficher tant que tout va bien ou que l'utilisateur a déjà tranché
        if (status === 'unsupported' || status === 'subscribed' || status === 'denied') {
            return null;
        }

        if (Notification.permission !== 'default') return null;

        return (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm mx-auto">
                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-bounce-in">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mt-0.5 text-white">
                        {bellIcon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Activer les notifications
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Recevez les alertes de tâches et projets, même avec l'onglet fermé.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={requestPermission}
                                disabled={status === 'requesting'}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {status === 'requesting' ? 'En cours...' : '🔔 Autoriser'}
                            </button>
                            <button
                                onClick={() => setStatus('denied')}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1.5 px-2 transition-colors"
                            >
                                Plus tard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Mode "inline" (carte intégrée dans une page de réglages) ──
    // Ici on affiche toujours quelque chose, y compris quand c'est déjà activé,
    // pour donner un statut clair à l'utilisateur (pas de disparition silencieuse).

    if (status === 'unsupported') {
        return (
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    🔔 Notifications push (navigateur)
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Votre navigateur ne supporte pas les notifications push. Sur iPhone/iPad, ajoutez d'abord
                    ProJA à votre écran d'accueil depuis Safari pour activer cette fonctionnalité.
                </p>
            </div>
        );
    }

    if (status === 'subscribed') {
        return (
            <div className="mt-6 rounded-xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                    {bellIcon}
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Notifications push activées
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                        Vous recevrez des alertes sur cet appareil, même l'onglet fermé.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'denied' || Notification.permission === 'denied') {
        return (
            <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    🔕 Notifications push bloquées
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Vous avez refusé les notifications de ce navigateur. Pour les réactiver, changez
                    l'autorisation dans les réglages du site depuis votre navigateur (icône 🔒 à côté de
                    l'URL), puis rechargez la page.
                </p>
            </div>
        );
    }

    // status === 'idle' ou 'requesting', permission par défaut → proposer l'activation
    return (
        <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mt-0.5 text-white">
                {bellIcon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Activer les notifications push
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    En plus de vos préférences email ci-dessus, recevez une alerte directement sur cet
                    appareil, même l'onglet fermé.
                </p>
                <button
                    onClick={requestPermission}
                    disabled={status === 'requesting'}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-4 rounded-lg transition-colors disabled:opacity-60"
                >
                    {status === 'requesting' ? 'En cours...' : '🔔 Activer sur cet appareil'}
                </button>
            </div>
        </div>
    );
}