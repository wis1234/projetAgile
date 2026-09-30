import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    UserCircleIcon, BellIcon, ShieldCheckIcon, BanknotesIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import NotificationPreferencesForm from './Partials/NotificationPreferencesForm';

const sections = [
    { id: 'profil', label: 'Informations', icon: UserCircleIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'securite', label: 'Sécurité', icon: ShieldCheckIcon },
    { id: 'danger', label: 'Zone sensible', icon: ExclamationTriangleIcon },
];

export default function Edit({ mustVerifyEmail, status, notificationPreferences, profile }) {
    const user = profile;
    const [active, setActive] = useState('profil');

    // Surbrillance de la rubrique visible pendant le défilement
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
            { rootMargin: '-25% 0px -65% 0px' },
        );
        sections.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, []);

    const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const avatar = user.profile_photo_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2563eb&color=fff&size=160`;

    const navItem = (active_) =>
        `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            active_
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
        }`;

    return (
        <AdminLayout>
            <Head title="Mon profil" />
            <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
                {/* Bandeau */}
                <div className="relative">
                    <div className="h-36 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 sm:h-44" />
                    <div className="mx-auto -mt-14 max-w-6xl px-4 sm:-mt-16 sm:px-6">
                        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
                            <img
                                src={avatar}
                                alt={user.name}
                                className="h-28 w-28 rounded-2xl border-4 border-white bg-white object-cover shadow-lg dark:border-slate-900 sm:h-32 sm:w-32"
                            />
                            <div className="min-w-0 pb-1 sm:pb-3">
                                <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{user.name}</h1>
                                <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">
                                    {[user.job_title, user.company].filter(Boolean).join(' · ') || user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[15rem_1fr]">
                    {/* Navigation */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:flex-col lg:overflow-visible">
                            {sections.map(({ id, label, icon: Icon }) => (
                                <button key={id} type="button" onClick={() => go(id)} className={`${navItem(active === id)} whitespace-nowrap`}>
                                    <Icon className="h-5 w-5 shrink-0" /> {label}
                                </button>
                            ))}
                            <Link href={route('profile.bank-details')} className={`${navItem(false)} whitespace-nowrap`}>
                                <BanknotesIcon className="h-5 w-5 shrink-0" /> Informations bancaires
                            </Link>
                        </nav>
                    </aside>

                    {/* Contenu */}
                    <div className="min-w-0 space-y-6">
                        <UpdateProfileInformationForm profile={profile} mustVerifyEmail={mustVerifyEmail} status={status} />
                        <NotificationPreferencesForm notificationPreferences={notificationPreferences} />
                        <UpdatePasswordForm />
                        <DeleteUserForm />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
