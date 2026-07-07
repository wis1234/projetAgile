import axios from 'axios';

const redirectToLogin = () => {
    if (window.location.pathname === '/login') return;
    window.location.href = '/login';
};

export function setupGlobalErrorHandler() {

    // ── Intercepteur axios global ─────────────────────────
    axios.interceptors.response.use(
        response => response,
        error => {
            if (!error.response) return Promise.reject(error);

            const { status, headers } = error.response;

            // Session / CSRF expirés → login
            if (status === 401 || status === 419) {
                redirectToLogin();
                return new Promise(() => {}); // stoppe la chaîne proprement
            }

            // 403 → laisser Inertia/Handler gérer
            if (status === 403) return Promise.reject(error);

            // Réponse HTML inattendue (Laravel renvoie la page login en HTML)
            // = session expirée non interceptée avant
            const contentType = headers['content-type'] ?? '';
            if (contentType.includes('text/html')) {
                redirectToLogin();
                return new Promise(() => {});
            }

            return Promise.reject(error);
        }
    );

    // ── Promesses non gérées ──────────────────────────────
    window.addEventListener('unhandledrejection', (event) => {
        const response = event.reason?.response;
        if (!response) return;

        const { status, headers } = response;

        if (status === 401 || status === 419) {
            event.preventDefault();
            redirectToLogin();
            return;
        }

        const contentType = headers?.['content-type'] ?? '';
        if (contentType.includes('text/html')) {
            event.preventDefault();
            redirectToLogin();
        }
    });

    // ── Erreurs JS globales ───────────────────────────────
    // Garder uniquement pour le debug, ne jamais reloader
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('JS Error:', { message, source, lineno, error });
        return false; // laisser le comportement par défaut
    };
}

setupGlobalErrorHandler();
export default setupGlobalErrorHandler;