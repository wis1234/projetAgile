import axios from 'axios';

/**
 * Initialise le gestionnaire d'erreurs global
 */
export function setupGlobalErrorHandler() {
    // Intercepteur pour les erreurs de session expirée
    axios.interceptors.response.use(
        response => response,
        error => {
            if (error.response && error.response.status === 419) {
                // Si c'est une requête AJAX, on affiche la modale de session expirée
                if (window.showSessionExpired) {
                    window.showSessionExpired();
                } else if (window.showCsrfError) {
                    // Fallback si showSessionExpired n'est pas disponible
                    window.showCsrfError('session');
                }
            }
            return Promise.reject(error);
        }
    );

    // Gestionnaire d'erreur global pour le window.onerror
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        // Vérifier si c'est une erreur de session expirée
        if (typeof message === 'string' && message.includes('419')) {
            if (window.showSessionExpired) {
                window.showSessionExpired();
                return true; // Empêche la propagation de l'erreur
            }
        }
        
        // Appel du gestionnaire d'erreur original s'il existe
        if (typeof originalOnError === 'function') {
            return originalOnError.apply(this, arguments);
        }
        
        return false; // Laisse l'erreur se propager
    };

    // Gestionnaire pour les promesses non attrapées
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.response) {
            const { status } = event.reason.response;
            if (status === 419) {
                if (window.showSessionExpired) {
                    window.showSessionExpired();
                    event.preventDefault(); // Empêche la propagation de l'erreur
                }
            }
        }
    });
}

// Initialiser automatiquement le gestionnaire d'erreurs
export default setupGlobalErrorHandler();
