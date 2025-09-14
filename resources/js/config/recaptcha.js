/**
 * Configuration reCAPTCHA v3
 * 
 * Ce fichier contient la configuration pour reCAPTCHA v3
 * La clé du site est chargée depuis les variables d'environnement
 */

// Configuration reCAPTCHA v3
export const RECAPTCHA_CONFIG = {
    // La clé du site est chargée depuis les variables d'environnement exposées par Vite
    siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LcW4LcpAAAAAIp4G4y7Z8Z4Z4Z4Z4Z4Z4Z4Z4Z4',
    action: 'submit', // Action par défaut
    threshold: 0.5, // Score minimum requis
};

// Charge le script reCAPTCHA de manière asynchrone
export function loadReCaptcha() {
    return new Promise((resolve, reject) => {
        if (window.grecaptcha) {
            resolve(window.grecaptcha);
            return;
        }

        window.onReCaptchaLoad = () => {
            delete window.onReCaptchaLoad;
            resolve(window.grecaptcha);
        };

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_CONFIG.siteKey}&onload=onReCaptchaLoad`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Exécute reCAPTCHA avec une action spécifique
export async function executeRecaptcha(action = RECAPTCHA_CONFIG.action) {
    try {
        const grecaptcha = await loadReCaptcha();
        return await grecaptcha.execute(RECAPTCHA_CONFIG.siteKey, { action });
    } catch (error) {
        console.error('Erreur lors de l\'exécution de reCAPTCHA:', error);
        return null;
    }
}
