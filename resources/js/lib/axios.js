import axios from 'axios';
import { router } from '@inertiajs/react';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

// ── Instance axios configurée ─────────────────────────────
const axiosInstance = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// ── Intercepteur requête : ajout CSRF ─────────────────────
const requestInterceptor = config => {
    if (['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
        return config;
    }
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
};

// Appliquer sur l'instance ET sur axios global (utilisé par Inertia)
axiosInstance.interceptors.request.use(requestInterceptor, e => Promise.reject(e));
axios.interceptors.request.use(requestInterceptor, e => Promise.reject(e));

// ── Fonction de redirection vers login ────────────────────
const redirectToLogin = () => {
    // Éviter les redirections en boucle si on est déjà sur login
    if (window.location.pathname === '/login') return;
    window.location.href = '/login';
};

// ── Intercepteur réponse ──────────────────────────────────
const responseInterceptor = [
    response => response,
    error => {
        if (!error.response) {
            console.error('Erreur réseau - Vérifiez votre connexion');
            return Promise.reject(error);
        }

        const { status } = error.response;

        switch (status) {
            case 401:
                // Session expirée → redirection propre
                redirectToLogin();
                return new Promise(() => {}); // stoppe la chaîne

            case 419:
                // CSRF expiré → redirection propre (pas de reload)
                redirectToLogin();
                return new Promise(() => {}); // stoppe la chaîne

            case 403:
                // Accès refusé → laisser Inertia gérer (page Error403)
                break;

            case 422:
                // Validation → laisser le composant gérer
                break;

            case 500:
                console.error('Erreur serveur interne');
                break;

            default:
                console.error(`Erreur ${status}`);
        }

        return Promise.reject(error);
    }
];

// Appliquer sur l'instance ET sur axios global
axiosInstance.interceptors.response.use(...responseInterceptor);
axios.interceptors.response.use(...responseInterceptor);

export default axiosInstance;