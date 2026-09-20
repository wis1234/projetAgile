import axios from 'axios';
import { router } from '@inertiajs/react';
import handleSessionExpired from '@/lib/sessionExpired';

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
// Le jeton du <meta> est figé au chargement de la page : dans une application Inertia (navigation sans rechargement),
// il devient obsolète après une déconnexion / reconnexion et provoque des erreurs 419 silencieuses (inscription,
// connexion…). Le cookie XSRF-TOKEN, lui, est renouvelé à chaque réponse : on le préfère.
const readXsrfCookie = () => {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

const requestInterceptor = config => {
    if (['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
        return config;
    }

    const cookieToken = readXsrfCookie();
    if (cookieToken) {
        config.headers['X-XSRF-TOKEN'] = cookieToken;
        delete config.headers['X-CSRF-TOKEN'];
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

// ── Session expirée : message clair au lieu d'une redirection silencieuse ──
const suspendOrFail = (error) => (handleSessionExpired() ? new Promise(() => {}) : Promise.reject(error));

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
            case 419:
                // Session / CSRF expiré : page privée → /login?expired=1 ; page publique → message + jeton renouvelé
                return suspendOrFail(error);

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