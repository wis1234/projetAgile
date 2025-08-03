import axios from 'axios';
import { router } from '@inertiajs/react';

// Créer une instance d'axios avec la configuration de base
const axiosInstance = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Intercepteur de requête pour ajouter le token CSRF
axiosInstance.interceptors.request.use(
    config => {
        // Ne pas ajouter le token CSRF pour les requêtes sortantes
        if (['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
            return config;
        }
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Intercepteur de réponse pour gérer les erreurs
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            // Erreur réseau ou serveur indisponible
            console.error('Erreur réseau - Vérifiez votre connexion');
            return Promise.reject(error);
        }

        const { status } = error.response;
        
        switch (status) {
            case 401: // Non authentifié
                // Rediriger vers la page de connexion avec un message
                if (typeof window !== 'undefined') {
                    const returnUrl = window.location.pathname + window.location.search;
                    router.visit('/login', {
                        data: {
                            message: 'Votre session a expiré. Veuillez vous reconnecter.',
                            status: 401,
                            return: returnUrl
                        },
                        preserveState: false,
                        replace: true
                    });
                }
                break;
                
            case 419: // CSRF Token Mismatch
                // Afficher le modal d'erreur CSRF si la fonction est disponible
                if (typeof window !== 'undefined' && window.showCsrfError) {
                    window.showCsrfError();
                } else {
                    console.error('CSRF token mismatch. Please refresh the page.');
                }
                break;
                
            case 422: // Erreur de validation
                // Laisser passer pour que le composant puisse gérer les erreurs de validation
                break;
                
            case 500: // Erreur serveur
                console.error('Erreur serveur - Veuillez réessayer plus tard');
                break;
                
            default:
                console.error(`Erreur ${status} - ${error.response?.data?.message || 'Une erreur est survenue'}`);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
