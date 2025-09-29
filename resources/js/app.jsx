import '../css/app.css';
import './bootstrap';

import { createInertiaApp as createInertiaAppOriginal } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import CsrfErrorModal from '@/Components/CsrfErrorModal';
import { TutorialProvider } from '@/contexts/TutorialContext';
import './lib/axios';
import './lib/globalErrorHandler';

const appName = import.meta.env.VITE_APP_NAME || 'Proja';

// Créer un composant racine personnalisé
function AppWithCsrfErrorModal({ children }) {
    return (
        <>
            {children}
            <CsrfErrorModal />
        </>
    );
}

// Surcharger la fonction createInertiaApp pour inclure notre composant
const createInertiaApp = (options) => {
    return createInertiaAppOriginal({
        ...options,
        setup({ el, App, props }) {
            const root = createRoot(el);

            root.render(
                <TutorialProvider>
                    <AppWithCsrfErrorModal>
                        <App {...props} />
                    </AppWithCsrfErrorModal>
                </TutorialProvider>
            );
        },
    });
};

// Initialiser l'application Inertia
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
