import '../css/app.css';
import './bootstrap';
import { createInertiaApp as createInertiaAppOriginal, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import CsrfErrorModal from '@/Components/CsrfErrorModal';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './lib/axios';
import './lib/globalErrorHandler';
import './echo';

const appName = import.meta.env.VITE_APP_NAME || 'Proja';

function AppWithCsrfErrorModal({ children }) {
    return (
        <>
            {children}
            <CsrfErrorModal />
        </>
    );
}

const createInertiaApp = (options) => {
    return createInertiaAppOriginal({
        ...options,
        setup({ el, App, props }) {
            const root = createRoot(el);
            root.render(
                <I18nextProvider i18n={i18n}>
                    <TutorialProvider>
                        <AppWithCsrfErrorModal>
                            <App {...props} />
                        </AppWithCsrfErrorModal>
                    </TutorialProvider>
                </I18nextProvider>
            );
        },
    });
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    progress: {
        color: '#4B5563',
    },
});

if (typeof window !== 'undefined') {
    // Fix 1 — Duplication d'onglet / retour depuis le cache navigateur (bfcache)
    window.addEventListener('pageshow', async (event) => {
        if (!event.persisted) return;

        try {
            const res = await fetch('/api/check-auth', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            if (res.status === 401 || res.status === 419) {
                window.location.href = '/login';
                return;
            }

            // On repasse par le router Inertia plutôt qu'un reload() complet,
            // pour forcer une visite fraîche (HTML) sans casser le comportement SPA.
            //
            // Important : on n'utilise PAS `only: []`. `only` sert aux partial
            // reloads (le serveur ne renvoie que les props listées) ; un tableau
            // vide ne garantit pas un rechargement complet et fiable des données.
            // Un visit standard (sans `only`) fait une requête Inertia normale,
            // renvoie toutes les props, et avec preserveState: false le composant
            // est remonté avec un état 100% frais (utile si la session/les
            // permissions ont changé pendant que l'onglet était en bfcache).
            router.visit(window.location.pathname, {
                preserveScroll: true,
                preserveState: false,
            });
        } catch {
            window.location.href = '/login';
        }
    });

    // Fix 2 — Rechargement si l'onglet est resté inactif plus de 30 minutes
    let hiddenAt = null;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            hiddenAt = Date.now();
            return;
        }

        if (document.visibilityState === 'visible' && hiddenAt !== null) {
            const elapsed = Date.now() - hiddenAt;
            if (elapsed > INACTIVITY_LIMIT) {
                router.visit(window.location.pathname);
            }
            hiddenAt = null;
        }
    });

    // Fix 3 — Interception globale des réponses invalides (401 / 403 / 419)
    router.on('invalid', (event) => {
        event.preventDefault();
        const status = event.detail.response.status;

        if (status === 403) {
            window.location.href = '/403';
        } else {
            // 401, 419 (CSRF/session expirés), ou tout autre cas inattendu
            window.location.href = '/login';
        }
    });
}