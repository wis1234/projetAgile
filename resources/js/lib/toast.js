/**
 * Mini système de notifications (« toasts ») utilisable partout, sans contexte React :
 *
 *   import toast from '@/lib/toast';
 *   toast.success('Compte créé');
 *   toast.error('Email déjà utilisé', { title: 'Inscription impossible', action: { label: 'Se connecter', href: '/login' } });
 *
 * Dans un composant, préférez le hook `useToast()` (mêmes méthodes).
 * Le composant <Toaster /> (monté une seule fois dans app.jsx) affiche les notifications.
 */

const listeners = new Set();
let counter = 0;
const recent = new Map(); // anti-doublon : même message ignoré pendant 1,5 s

const DEFAULT_DURATION = { success: 5000, info: 5000, warning: 7000, error: 8000 };

function emit(event) {
    listeners.forEach((fn) => fn(event));
}

function show(type, message, options = {}) {
    if (!message && !options.title) return null;

    const key = `${type}|${options.title || ''}|${message}`;
    const now = Date.now();
    if (recent.has(key) && now - recent.get(key) < 1500) return null;
    recent.set(key, now);

    const id = options.id ?? `t${++counter}`;
    emit({
        kind: 'add',
        toast: {
            id,
            type,
            title: options.title,
            message,
            action: options.action,
            duration: options.duration ?? DEFAULT_DURATION[type] ?? 5000,
        },
    });

    return id;
}

const toast = {
    show,
    success: (message, options) => show('success', message, options),
    error: (message, options) => show('error', message, options),
    warning: (message, options) => show('warning', message, options),
    info: (message, options) => show('info', message, options),
    dismiss: (id) => emit({ kind: 'remove', id }),
    clear: () => emit({ kind: 'clear' }),
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
    /** Vrai si un <Toaster /> est monté (sinon on retombe sur un comportement de secours). */
    isReady: () => listeners.size > 0,
};

export default toast;
