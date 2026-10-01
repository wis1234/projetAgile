import React, { useCallback, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    FaUserCircle, FaBell, FaShieldAlt, FaUniversity, FaExclamationTriangle, FaChevronRight, FaSignOutAlt, FaEnvelope, FaPhone,
} from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MCard, MSectionTitle } from '@/Components/Mobile/kit';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import NotificationPreferencesForm from '@/Pages/Profile/Partials/NotificationPreferencesForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import BankDetailsForm from '@/Pages/Profile/Partials/BankDetailsForm';
import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';

const SECTIONS = [
    { id: 'profil', title: 'Informations personnelles', hint: 'Photo, nom, poste, présentation', icon: FaUserCircle, tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
    { id: 'notifications', title: 'Notifications', hint: 'Alertes e-mail et push', icon: FaBell, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
    { id: 'securite', title: 'Mot de passe', hint: 'Sécurité du compte', icon: FaShieldAlt, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { id: 'banque', title: 'Informations bancaires', hint: 'Coordonnées de paiement', icon: FaUniversity, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
    { id: 'danger', title: 'Supprimer mon compte', hint: 'Action définitive', icon: FaExclamationTriangle, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', danger: true },
];
const ids = SECTIONS.map((s) => s.id);
const fromHash = () => {
    const h = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    return ids.includes(h) ? h : null;
};

export default function MobileProfileEdit({ mustVerifyEmail, status, notificationPreferences, profile, bankDetails }) {
    const [sec, setSec] = useState(fromHash);

    // Le bouton retour du téléphone ferme la section ouverte au lieu de quitter le profil
    useEffect(() => {
        const onHash = () => setSec(fromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    useEffect(() => { window.scrollTo?.({ top: 0 }); }, [sec]);

    const open = useCallback((id) => { window.location.hash = id; setSec(id); }, []);
    const close = useCallback(() => {
        if (window.location.hash) window.history.back(); else setSec(null);
    }, []);
    const logout = () => router.post('/logout');

    const current = SECTIONS.find((s) => s.id === sec);

    return (
        <MobileLayout title={current ? current.title : 'Mon profil'} onBack={current ? close : undefined} backHref={current ? undefined : '/more'}>
            <Head title="Mon profil" />

            {!current ? (
                <div className="space-y-5 py-4 pb-10">
                    {/* Carte d'identité */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 text-white shadow-lg">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />
                        <div className="relative flex items-center gap-4">
                            <div className="rounded-2xl bg-white/90 p-1 shadow-lg">
                                <Avatar name={profile.name} src={profile.profile_photo_url} size="xl" className="!h-20 !w-20 !rounded-xl" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-extrabold">{profile.name}</h1>
                                <p className="truncate text-sm text-blue-100">{[profile.job_title, profile.company].filter(Boolean).join(' · ') || 'Complétez votre profil'}</p>
                            </div>
                        </div>
                        <div className="relative mt-4 flex flex-wrap gap-2">
                            {profile.email && <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium"><FaEnvelope className="shrink-0" /><span className="truncate">{profile.email}</span></span>}
                            {profile.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium"><FaPhone /> {profile.phone}</span>}
                        </div>
                        <button type="button" onClick={() => open('profil')} className="relative mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-blue-700 shadow-sm active:scale-[.98]">
                            Modifier mon profil
                        </button>
                    </section>

                    {status && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{status}</p>}

                    <div>
                        <MSectionTitle>Paramètres</MSectionTitle>
                        <div className="space-y-2">
                            {SECTIONS.filter((s) => !s.danger).map((s) => (
                                <MCard key={s.id} onClick={() => open(s.id)} className="!p-3.5">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><s.icon /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.hint}</p>
                                        </div>
                                        <FaChevronRight className="shrink-0 text-xs text-slate-300" />
                                    </div>
                                </MCard>
                            ))}
                        </div>
                    </div>

                    <div>
                        <MSectionTitle>Compte</MSectionTitle>
                        <div className="space-y-2">
                            {SECTIONS.filter((s) => s.danger).map((s) => (
                                <MCard key={s.id} onClick={() => open(s.id)} className="!p-3.5">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><s.icon /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-rose-600 dark:text-rose-400">{s.title}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.hint}</p>
                                        </div>
                                        <FaChevronRight className="shrink-0 text-xs text-slate-300" />
                                    </div>
                                </MCard>
                            ))}
                            <button type="button" onClick={logout} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 text-sm font-extrabold text-rose-600 transition active:scale-[.98] dark:bg-rose-950/30 dark:text-rose-400">
                                <FaSignOutAlt /> Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-4 pb-24">
                    {sec === 'profil' && <UpdateProfileInformationForm profile={profile} mustVerifyEmail={mustVerifyEmail} status={status} />}
                    {sec === 'notifications' && <NotificationPreferencesForm notificationPreferences={notificationPreferences} />}
                    {sec === 'securite' && <UpdatePasswordForm />}
                    {sec === 'banque' && <BankDetailsForm bankDetails={bankDetails} />}
                    {sec === 'danger' && <DeleteUserForm />}
                </div>
            )}
        </MobileLayout>
    );
}
