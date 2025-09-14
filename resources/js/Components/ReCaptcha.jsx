import { useEffect, useRef } from 'react';

export default function ReCaptcha({ onVerify, action }) {
    const recaptchaRef = useRef();
    const scriptId = 'google-recaptcha-v3';

    useEffect(() => {
        // Charger le script reCAPTCHA si pas déjà chargé
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.MIX_RECAPTCHA_SITE_KEY}`;
            script.async = true;
            script.defer = true;
            script.onload = initializeReCaptcha;
            document.head.appendChild(script);
        } else if (window.grecaptcha) {
            initializeReCaptcha();
        }

        return () => {
            // Nettoyage si nécessaire
        };
    }, []);

    const initializeReCaptcha = () => {
        if (window.grecaptcha) {
            window.grecaptcha.ready(() => {
                executeReCaptcha();
            });
        }
    };

    const executeReCaptcha = async () => {
        if (!window.grecaptcha) return;
        
        try {
            const token = await window.grecaptcha.execute(
                process.env.MIX_RECAPTCHA_SITE_KEY, 
                { action: action || 'submit' }
            );
            onVerify(token);
        } catch (error) {
            console.error('reCAPTCHA Error:', error);
            // En cas d'erreur, on appelle quand même onVerify avec null
            // pour ne pas bloquer le formulaire
            onVerify(null);
        }
    };

    // Pas de rendu visuel nécessaire pour reCAPTCHA v3
    return null;
}
