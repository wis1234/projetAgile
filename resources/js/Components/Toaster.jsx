import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import toast from '@/lib/toast';

const STYLES = {
    success: { icon: FaCheckCircle, bar: 'bg-emerald-500', ring: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', title: 'Succès' },
    error: { icon: FaExclamationCircle, bar: 'bg-red-500', ring: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', title: 'Erreur' },
    warning: { icon: FaExclamationTriangle, bar: 'bg-amber-500', ring: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', title: 'Attention' },
    info: { icon: FaInfoCircle, bar: 'bg-blue-500', ring: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', title: 'Information' },
};

/** Lit les props de la page initiale (attribut data-page ou balise <script data-page>). */
function readInitialPage() {
    try {
        const el = document.querySelector('script[data-page="app"]') || document.getElementById('app');
        const raw = el?.dataset?.page || el?.textContent;
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Affiche les notifications de `toast` et transforme les messages « flash » du serveur en notifications
 * sur les pages publiques (les pages connectées ont déjà leur propre affichage dans AdminLayout).
 */
function flashToToasts(page) {
    if (!page?.props || page.props.auth?.user) return;
    const flash = page.props.flash || {};

    ['success', 'error', 'warning', 'info'].forEach((type) => {
        if (flash[type]) toast[type](flash[type]);
    });
}

function ToastItem({ item, onClose }) {
    const [paused, setPaused] = useState(false);
    const s = STYLES[item.type] || STYLES.info;
    const Icon = s.icon;
    const remaining = useRef(item.duration);
    const startedAt = useRef(Date.now());
    const timer = useRef(null);

    useEffect(() => {
        if (!item.duration) return undefined;
        if (paused) {
            clearTimeout(timer.current);
            remaining.current -= Date.now() - startedAt.current;
            return undefined;
        }
        startedAt.current = Date.now();
        timer.current = setTimeout(onClose, Math.max(remaining.current, 800));
        return () => clearTimeout(timer.current);
    }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

    const runAction = () => {
        if (item.action?.onClick) item.action.onClick();
        if (item.action?.href) router.visit(item.action.href);
        onClose();
    };

    return (
        <div
            role={item.type === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border bg-white shadow-xl dark:bg-gray-900 ${s.ring} animate-[toastIn_.22s_ease-out]`}
        >
            <div className="flex items-start gap-3 p-4 pr-10">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.text}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title || s.title}</p>
                    {item.message && <p className="mt-0.5 text-sm leading-snug text-gray-600 dark:text-gray-300">{item.message}</p>}
                    {item.action && (
                        <button
                            type="button"
                            onClick={runAction}
                            className={`mt-2 text-sm font-semibold underline underline-offset-2 ${s.text}`}
                        >
                            {item.action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la notification"
                className="absolute right-2 top-2 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
                <FaTimes className="h-3 w-3" />
            </button>
            {item.duration > 0 && (
                <span
                    className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`}
                    style={{
                        width: '100%',
                        animation: `toastBar ${item.duration}ms linear forwards`,
                        animationPlayState: paused ? 'paused' : 'running',
                    }}
                />
            )}
        </div>
    );
}

export default function Toaster() {
    const [items, setItems] = useState([]);

    const remove = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), []);

    useEffect(() => {
        const unsubscribe = toast.subscribe((event) => {
            if (event.kind === 'add') {
                setItems((list) => [...list.filter((t) => t.id !== event.toast.id), event.toast].slice(-4));
            } else if (event.kind === 'remove') {
                remove(event.id);
            } else if (event.kind === 'clear') {
                setItems([]);
            }
        });

        // Messages du serveur : page affichée au chargement, puis chaque navigation (redirection après un POST…)
        flashToToasts(readInitialPage());
        const off = router.on('navigate', (event) => flashToToasts(event.detail.page));

        return () => {
            unsubscribe();
            off?.();
        };
    }, [remove]);

    return (
        <>
            <style>{`
                @keyframes toastIn { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: none; } }
                @keyframes toastBar { from { transform: scaleX(1); transform-origin: left; } to { transform: scaleX(0); transform-origin: left; } }
                @media (prefers-reduced-motion: reduce) { [role="status"], [role="alert"] { animation: none !important; } }
            `}</style>
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 top-0 z-[10000] flex flex-col items-center gap-2 p-3 sm:items-end sm:p-5"
            >
                <div className="flex w-full max-w-sm flex-col gap-2">
                    {items.map((item) => (
                        <ToastItem key={item.id} item={item} onClose={() => remove(item.id)} />
                    ))}
                </div>
            </div>
        </>
    );
}
