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

// Fix 1 — Rechargement sur retour d'onglet inactif (bfcache)
if (typeof window !== 'undefined') {
    // Fix 1 — Duplication d'onglet et bfcache
    window.addEventListener('pageshow', async (event) => {
        if (event.persisted) {
            // Vérifier si la session est encore valide avant de recharger
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
                } else {
                    window.location.reload();
                }
            } catch {
                window.location.href = '/login';
            }
        }
    });

    // Fix 2 — Rechargement si l'onglet était inactif plus de 30 minutes
    let hiddenAt = null;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            hiddenAt = Date.now();
        } else if (document.visibilityState === 'visible' && hiddenAt !== null) {
            const elapsed = Date.now() - hiddenAt;
            if (elapsed > INACTIVITY_LIMIT) {
                window.location.reload();
            }
            hiddenAt = null;
        }
    });

    // Fix 3 — Intercepter les erreurs 419 (CSRF expiré) globalement
router.on('invalid', (event) => {
    event.preventDefault();
    const status = event.detail.response.status;
    
    if (status === 401 || status === 419) {
        // Session ou CSRF expirés → redirection propre vers login
        window.location.href = '/login';
    } else if (status === 403) {
        window.location.href = '/403';
    } else {
        // Autre réponse invalide inattendue → login par sécurité
        window.location.href = '/login';
    }
});
}