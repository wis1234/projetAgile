import '../css/app.css';
import './bootstrap';
import { createInertiaApp as createInertiaAppOriginal, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import CsrfErrorModal from '@/Components/CsrfErrorModal';
import Toaster from '@/Components/Toaster';
import toast from '@/lib/toast';
import handleSessionExpired from '@/lib/sessionExpired';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './lib/axios';
import './lib/globalErrorHandler';
import './echo';
import { isNativeApp, initializeNativeApp } from './lib/platform';
import MobilePageFallback from '@/Components/MobilePageFallback';
import { withPageBoundary } from '@/Components/Mobile/PageBoundary';
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
            <Toaster />
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

// Aperçu de l'interface mobile dans un navigateur : ouvrez n'importe quelle page avec ?mobile-ui=1
// (désactivation : ?mobile-ui=0). Le choix est mémorisé pour la session. Sans effet dans l'APK.
const previewMobileUi = () => {
    try {
        const flag = new URLSearchParams(window.location.search).get('mobile-ui');
        if (flag === '1') sessionStorage.setItem('proja:mobile-ui', '1');
        if (flag === '0') sessionStorage.removeItem('proja:mobile-ui');
        return sessionStorage.getItem('proja:mobile-ui') === '1';
    } catch {
        return false;
    }
};

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
            return withPageBoundary((await resolvePageComponent(`./Pages/${name}.jsx`, webPages)).default);
        }

        // Dans l'APK Capacitor : bascule automatique vers la version Mobile UI si elle existe.
        // Chaque page mobile est protégée : une erreur de rendu affiche un écran d'erreur, jamais un écran blanc.
        if (isNativeApp() || previewMobileUi()) {
            const mobileKey = mobilePageCandidates(name).find((candidate) => mobilePages[candidate]);
            if (mobileKey) {
                return withPageBoundary((await mobilePages[mobileKey]()).default);
            }

            // Toute page sans version dédiée reste dans un shell mobile :
            // aucune page desktop ne doit être montée comme layout racine dans Capacitor.
            const page = await resolvePageComponent(`./Pages/${name}.jsx`, webPages);
            return withPageBoundary((props) => (
                <MobilePageFallback PageComponent={page.default} pageName={name} {...props} />
            ));
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

    // Fix 3 — Interception globale des réponses invalides (HTML inattendu, 401, 403, 419, 5xx…)
    // - 401 / 419 : session ou jeton expiré → message clair (page publique) ou /login?expired=1 (page privée)
    // - 403       : page « accès refusé »
    // - autres    : notification à l'écran (au lieu d'une redirection silencieuse ou d'une alerte du navigateur)
    router.on('invalid', (event) => {
        event.preventDefault();
        const response = event.detail.response;
        const status = response.status;

        if (status === 403) {
            window.location.href = '/403';
            return;
        }

        if (status === 401 || status === 419) {
            handleSessionExpired();
            return;
        }

        let message = null;
        try {
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            message = data?.message || null;
        } catch {
            // Réponse HTML : pas de message exploitable.
        }

        console.error(`Réponse inattendue (${status}) pour ${response.config?.url ?? window.location.pathname}`);

        const text =
            status === 429
                ? 'Trop de requêtes en peu de temps. Patientez quelques instants puis réessayez.'
                : status >= 500
                ? 'Le serveur a rencontré un problème. Vos données sont conservées : réessayez dans quelques instants.'
                : message || `Une erreur est survenue (code ${status}). Veuillez réessayer ou rafraîchir la page.`;

        if (toast.isReady()) {
            toast.error(text, { title: status >= 500 ? 'Erreur serveur' : 'Action impossible' });
        } else {
            window.alert(text);
        }
    });

    // Fix 4 — Perte de connexion / délai dépassé (aucune réponse du serveur)
    router.on('exception', (event) => {
        if (event.detail?.exception?.response) return; // une réponse existe : gérée ci-dessus
        toast.error(
            navigator.onLine === false
                ? 'Vous semblez hors ligne. Vérifiez votre connexion internet puis réessayez.'
                : 'Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.',
            { title: 'Connexion impossible' }
        );
    });
}
