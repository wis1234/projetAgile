import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { router } from '@inertiajs/react';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

async function getFreshCsrfToken() {
    const res = await fetch('/csrf-token', { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`[Push] CSRF fetch failed (${res.status})`);
    const data = await res.json();
    return data.token;
}

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
        console.warn('[Push] Session expirée (419)');
        window.location.reload();
        return null;
    }
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`[Push] Échec enregistrement (${response.status}) ${text}`);
    }
    return response.json().catch(() => null);
}

// ── Native (Capacitor/FCM) : enregistre le token d'appareil côté Laravel ──
async function saveDeviceToken(token, platform) {
    const csrfToken = await getFreshCsrfToken();
    const response = await fetch('/device-tokens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            token,
            platform,
            device_name: navigator.userAgent?.slice(0, 255) || null,
        }),
    });

    if (response.status === 419) {
        console.warn('[Push] Session expirée (419)');
        window.location.reload();
        return null;
    }
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`[Push] Échec enregistrement token natif (${response.status}) ${text}`);
    }
    return response.json().catch(() => null);
}

async function deleteDeviceToken(token) {
    try {
        const csrfToken = await getFreshCsrfToken();
        await fetch('/device-tokens', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ token }),
        });
    } catch (error) {
        console.warn('[Push] Échec suppression token natif:', error);
    }
}

export default function PushNotificationManager() {
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        try {
            // ── App mobile native (Capacitor) : FCM via @capacitor/push-notifications ──
            if (Capacitor.isNativePlatform()) {
                initNativePush();
                return;
            }

            // ── Vérification complète de compatibilité (inclut Notification !) ──
            if (
                !('Notification' in window) ||
                !('serviceWorker' in navigator) ||
                !('PushManager' in window)
            ) {
                setStatus('unsupported');
                console.warn('[Push] Web Push non supporté dans ce contexte');
                return;
            }

            if (Notification.permission === 'denied') {
                setStatus('denied');
                return;
            }

            if (Notification.permission === 'granted') {
                registerAndSubscribe();
            }
        } catch (error) {
            console.error('[Push] Erreur init:', error);
            setStatus('unsupported');
        }
    }, []);

    // ─────────────────────────── Branche native (Android/iOS) ───────────────────────────
    async function initNativePush() {
        try {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                setStatus('denied');
                return;
            }

            await PushNotifications.register();

            // Token FCM reçu après register() → on l'envoie à Laravel
            PushNotifications.addListener('registration', async (token) => {
                try {
                    const platform = Capacitor.getPlatform(); // 'android' | 'ios'
                    await saveDeviceToken(token.value, platform);
                    localStorage.setItem('fcm_device_token', token.value);
                    setStatus('subscribed');
                } catch (error) {
                    console.error('[Push] Échec enregistrement token FCM:', error);
                }
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('[Push] Erreur enregistrement FCM:', error);
                setStatus('unsupported');
            });

            // L'utilisateur tape sur une notification classique (pas un appel,
            // celles-là sont gérées nativement par IncomingCallActivity) :
            // on navigue vers l'URL cible sans recharger toute l'app.
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                const url = action?.notification?.data?.url;
                if (url) {
                    router.visit(url);
                }
            });

            // Message reçu alors que l'app est déjà ouverte au premier plan :
            // FCM ne montre pas de notification système dans ce cas, donc on
            // laisse le composant lui-même décider (ex: rafraîchir la cloche).
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                window.dispatchEvent(
                    new CustomEvent('proja:fcm-foreground', { detail: notification })
                );
            });
        } catch (error) {
            console.error('[Push] Erreur init native:', error);
            setStatus('unsupported');
        }
    }

    // ─────────────────────────── Branche Web (existant, inchangé) ───────────────────────────
    async function registerAndSubscribe() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await saveSubscription(existingSubscription);
                setStatus('subscribed');
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
        } catch (error) {
            console.error('[Push] Erreur:', error);
            setStatus('unsupported');
        }
    }

    async function requestPermission() {
        try {
            setStatus('requesting');
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await registerAndSubscribe();
            } else {
                setStatus('denied');
            }
        } catch (error) {
            console.error('[Push] Erreur requestPermission:', error);
            setStatus('unsupported');
        }
    }

    if (status === 'unsupported' || status === 'subscribed' || status === 'denied') {
        return null;
    }

    // Sur natif, on ne montre jamais le bandeau web (le prompt système
    // s'affiche déjà via PushNotifications.requestPermissions()).
    if (Capacitor.isNativePlatform()) {
        return null;
    }

    // Accès protégé : ne jamais lire Notification.permission hors du bloc sécurisé ci-dessus
    let permission = 'default';
    try {
        permission = Notification.permission;
    } catch {
        return null;
    }

    if (permission === 'default') {
        return (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm mx-auto">
                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-bounce-in">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Activer les notifications</p>
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

    return null;
}

// Exporté pour être appelé explicitement au logout (ex: dans le handler
// du bouton "Déconnexion" de AdminLayout.jsx), afin de ne plus recevoir
// de push sur un appareil dont l'utilisateur vient de se déconnecter.
export async function unregisterDeviceToken() {
    const token = localStorage.getItem('fcm_device_token');
    if (token) {
        await deleteDeviceToken(token);
        localStorage.removeItem('fcm_device_token');
    }
}