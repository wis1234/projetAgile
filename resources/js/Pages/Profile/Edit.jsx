import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    UserCircleIcon, BellIcon, ShieldCheckIcon, BanknotesIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import NotificationPreferencesForm from './Partials/NotificationPreferencesForm';
import BankDetailsForm from './Partials/BankDetailsForm';

const TABS = [
    { id: 'profil', label: 'Informations', hint: 'Identité et photo', icon: UserCircleIcon },
    { id: 'notifications', label: 'Notifications', hint: 'Alertes e-mail et push', icon: BellIcon },
    { id: 'securite', label: 'Sécurité', hint: 'Mot de passe', icon: ShieldCheckIcon },
    { id: 'banque', label: 'Banque', hint: 'Coordonnées de paiement', icon: BanknotesIcon },
    { id: 'danger', label: 'Zone sensible', hint: 'Supprimer le compte', icon: ExclamationTriangleIcon, danger: true },
];
const ids = TABS.map((t) => t.id);
const fromHash = () => {
    const h = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    return ids.includes(h) ? h : 'profil';
};

export default function Edit({ mustVerifyEmail, status, notificationPreferences, profile, bankDetails }) {
    const [active, setActive] = useState(fromHash);
    // Onglets chargés à la première visite puis conservés (les saisies non enregistrées ne sont pas perdues)
    const [visited, setVisited] = useState(() => new Set([fromHash()]));
    const tabRefs = useRef({});

    const select = useCallback((id) => {
        setActive(id);
        setVisited((v) => (v.has(id) ? v : new Set(v).add(id)));
        window.history.replaceState(null, '', `#${id}`);
    }, []);

    // Bouton précédent / lien direct avec #ancre
    useEffect(() => {
        const onHash = () => select(fromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, [select]);

    // Garde l'onglet actif visible dans la barre défilante (mobile)
    useEffect(() => {
        tabRefs.current[active]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }, [active]);

    // Navigation clavier (← →) sur la liste d'onglets
    const onKey = (e) => {
        const i = ids.indexOf(active);
        const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
        if (next === null) return;
        e.preventDefault();
        const id = ids[(next + ids.length) % ids.length];
        select(id);
        tabRefs.current[id]?.focus();
    };

    const user = profile;
    const avatar = user.profile_photo_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2563eb&color=fff&size=160`;

    const panel = (id, node) =>
        visited.has(id) && (
            <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={active !== id} className={active === id ? 'animate-[fadeIn_.18s_ease-out]' : ''}>
                {node}
            </div>
        );

    return (
        <AdminLayout>
            <Head title="Mon profil" />
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
            <div className="min-h-screen bg-slate-50 pb-28 dark:bg-slate-900 lg:pb-16">
                {/* En-tête : dégradé bleu */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-sm" />
                    <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-indigo-400/20" />
                    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
                        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                            <img src={avatar} alt={user.name}
                                className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white/90 bg-white object-cover shadow-xl sm:h-28 sm:w-28" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Mon profil</p>
                                <h1 className="mt-1 truncate text-2xl font-bold text-white sm:text-3xl">{user.name}</h1>
                                <p className="mt-1 truncate text-sm text-blue-100">
                                    {[user.job_title, user.company].filter(Boolean).join(' · ') || user.email}
                                </p>
                                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                                    {user.email && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">{user.email}</span>}
                                    {user.phone && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">{user.phone}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-auto -mt-8 grid max-w-6xl gap-5 px-4 sm:-mt-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
                    {/* Onglets : barre défilante (mobile) / menu latéral (PC) */}
                    <aside className="-mx-4 sm:mx-0 lg:sticky lg:top-24 lg:self-start">
                        <div role="tablist" aria-orientation="vertical" onKeyDown={onKey}
                            className="flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-2 lg:shadow-sm lg:dark:border-slate-700 lg:dark:bg-slate-800 [&::-webkit-scrollbar]:hidden">
                            {TABS.map(({ id, label, hint, icon: Icon, danger }) => {
                                const on = active === id;
                                return (
                                    <button key={id} id={`tab-${id}`} ref={(el) => (tabRefs.current[id] = el)}
                                        role="tab" type="button" aria-selected={on} aria-controls={`panel-${id}`} tabIndex={on ? 0 : -1}
                                        onClick={() => select(id)}
                                        className={`flex shrink-0 snap-start items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition lg:w-full lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 lg:text-left ${
                                            on
                                                ? danger
                                                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                                    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/50 lg:bg-transparent lg:dark:bg-transparent'
                                        }`}>
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="flex flex-col leading-tight">
                                            <span>{label}</span>
                                            <span className="hidden text-xs font-normal opacity-70 lg:block">{hint}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Contenu de l'onglet actif */}
                    <div className="min-w-0">
                        {panel('profil', <UpdateProfileInformationForm profile={profile} mustVerifyEmail={mustVerifyEmail} status={status} />)}
                        {panel('notifications', <NotificationPreferencesForm notificationPreferences={notificationPreferences} />)}
                        {panel('securite', <UpdatePasswordForm />)}
                        {panel('banque', <BankDetailsForm bankDetails={bankDetails} />)}
                        {panel('danger', <DeleteUserForm />)}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
