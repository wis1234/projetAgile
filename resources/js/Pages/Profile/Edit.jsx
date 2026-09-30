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
                {/* Bandeau */}
                <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 sm:h-40" />
                <div className="mx-auto -mt-12 max-w-6xl px-4 sm:-mt-16 sm:px-6">
                    <div className="flex items-end gap-4">
                        <img src={avatar} alt={user.name}
                            className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-lg dark:border-slate-900 sm:h-32 sm:w-32" />
                        <div className="min-w-0 pb-1 sm:pb-3">
                            <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white sm:text-3xl">{user.name}</h1>
                            <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                                {[user.job_title, user.company].filter(Boolean).join(' · ') || user.email}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-6 grid max-w-6xl gap-5 px-4 sm:mt-8 sm:px-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
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
