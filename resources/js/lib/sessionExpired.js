import { router } from '@inertiajs/react';
import toast from '@/lib/toast';

// Pages accessibles sans être connecté : on y reste et on informe l'utilisateur.
const GUEST_PATHS = [/^\/register/, /^\/login/, /^\/forgot-password/, /^\/reset-password/];

let handling = false;

/**
 * Session ou jeton CSRF expiré (401 / 419).
 *  - Page publique (inscription, connexion…) : on reste sur la page, on avertit, on renouvelle le jeton
 *    (rechargement des données, formulaire conservé) → l'utilisateur peut simplement recliquer.
 *  - Page privée : redirection vers /login?expired=1 (la page de connexion explique pourquoi).
 *
 * @returns {boolean} true si l'on quitte la page (l'appelant peut alors suspendre la requête),
 *                    false si l'on reste (l'appelant doit laisser la requête échouer proprement,
 *                    sinon le bouton « en cours… » du formulaire resterait bloqué).
 */
export default function handleSessionExpired() {
    const path = window.location.pathname;
    const isGuestPage = GUEST_PATHS.some((rx) => rx.test(path));

    if (handling) return !isGuestPage;
    handling = true;
    setTimeout(() => { handling = false; }, 2000);

    if (isGuestPage) {
        toast.warning('Votre session de sécurité a expiré. Nous venons de la renouveler : cliquez à nouveau sur le bouton pour continuer.', {
            title: 'Session expirée',
        });
        router.reload({ preserveState: true, preserveScroll: true });
        return false;
    }

    window.location.href = '/login?expired=1';
    return true;
}
