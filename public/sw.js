// ============================================================
// ProJA — Service Worker pour les Web Push Notifications
// Ce fichier tourne en arrière-plan, même onglet fermé
// ============================================================

const CACHE_NAME = 'proja-v1';

// ─── Installation du Service Worker ─────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installé');
    self.skipWaiting(); // Activer immédiatement sans attendre
});

// ─── Activation ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activé');
    event.waitUntil(clients.claim()); // Prendre le contrôle immédiatement
});

// ─── Réception d'un message Push ────────────────────────────
self.addEventListener('push', (event) => {
    console.log('[SW] Message push reçu');

    if (!event.data) {
        console.warn('[SW] Push reçu sans données');
        return;
    }

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'ProJA',
            body: event.data.text(),
        };
    }

    const title   = data.title   || 'ProJA';
    const options = {
        body:    data.body   || 'Vous avez une nouvelle notification.',
        icon:    data.icon   || '/logo-proja.png',
        badge:   data.badge  || '/logo-proja.png',
        image:   data.image  || undefined,
        tag:     data.tag    || 'proja-notification',
        renotify: true,
        requireInteraction: false, // Ne pas bloquer l'écran
        data: {
            url:       data.url       || '/',
            notifId:   data.notifId   || null,
            createdAt: new Date().toISOString(),
        },
        actions: [
            {
                action: 'open',
                title: 'Voir',
            },
            {
                action: 'close',
                title: 'Fermer',
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ─── Clic sur la notification ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Clic sur notification', event.action);
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const targetUrl = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si un onglet ProJA est déjà ouvert → focus dessus
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Sinon → ouvrir un nouvel onglet
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// ─── Fermeture de notification ───────────────────────────────
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification fermée sans interaction');
});
