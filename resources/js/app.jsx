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
import { isNativeApp, initializeNativeApp } from './lib/platform';
import MobilePageFallback from '@/Components/MobilePageFallback';
import { useEffect } from 'react';


const appName = import.meta.env.VITE_APP_NAME || 'Proja';

function AppWithCsrfErrorModal({ children }) {
    useEffect(() => {
        document.documentElement.classList.toggle('native-mobile-app', isNativeApp());
        let cleanup;
        initializeNativeApp().then((removeListeners) => {
            cleanup = removeListeners;
        }).catch((error) => {
            console.warn('[Native] Initialisation indisponible:', error);
        });

        return () => {
            document.documentElement.classList.remove('native-mobile-app');
            cleanup?.();
        };
    }, []);

    useEffect(() => {
        const handleDeepLink = (event) => {
            try {
                const url = new URL(event.detail?.url);
                if (url.origin === window.location.origin) router.visit(`${url.pathname}${url.search}`);
            } catch {
                // Ignore malformed or external deep links.
            }
        };
        window.addEventListener('proja:deep-link', handleDeepLink);
        return () => window.removeEventListener('proja:deep-link', handleDeepLink);
    }, []);

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

const webPages = import.meta.glob('./Pages/**/*.jsx');
const mobilePages = import.meta.glob('./Pages/Mobile/**/*.jsx');

const mobilePageCandidates = (name) => {
    const parts = name.split('/').filter(Boolean);
    const leaf = parts[parts.length - 1];
    return [
        `./Pages/Mobile/${name}.jsx`,
        `./Pages/Mobile/${name}/${leaf}.jsx`,
    ];
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        // Les pages déjà situées sous Pages/Mobile/... ne repassent pas par le switch.
        if (name.startsWith('Mobile/')) {
            return (await resolvePageComponent(`./Pages/${name}.jsx`, webPages)).default;
        }

        // Dans l'APK Capacitor : bascule automatique vers la version Mobile UI si elle existe.
        if (isNativeApp()) {
            const mobileKey = mobilePageCandidates(name).find((candidate) => mobilePages[candidate]);
            if (mobileKey) {
                return (await mobilePages[mobileKey]()).default;
            }

            // Toute page sans version dédiée reste dans un shell mobile :
            // aucune page desktop ne doit être montée comme layout racine dans Capacitor.
            const page = await resolvePageComponent(`./Pages/${name}.jsx`, webPages);
            return (props) => (
                <MobilePageFallback PageComponent={page.default} pageName={name} {...props} />
            );
        }

        // Navigateur : page web habituelle.
        return (await resolvePageComponent(`./Pages/${name}.jsx`, webPages)).default;
    },
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