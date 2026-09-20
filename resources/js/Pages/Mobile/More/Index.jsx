import React, { useMemo, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaFolderOpen, FaCheckSquare, FaColumns, FaBolt, FaFileAlt, FaUsers, FaUserFriends, FaComments, FaBullseye, FaQuestionCircle, FaHistory, FaCreditCard, FaCoins, FaMoon, FaSun, FaCog, FaSignOutAlt, FaChevronRight, FaSearch } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import { unregisterDeviceToken } from '@/Components/PushNotificationManager';
import Avatar from '@/Components/Quiz/Avatar';
import { nativeFeedback } from '@/lib/platform';

const GROUPS = [
  { title: 'Espace de travail', items: [
    { href: '/dashboard', label: 'dashboard', fb: 'Accueil', Icon: FaHome, tone: 'from-blue-500 to-blue-600' },
    { href: '/projects', label: 'projects', fb: 'Projets', Icon: FaFolderOpen, tone: 'from-indigo-500 to-indigo-600' },
    { href: '/tasks', label: 'tasks', fb: 'Tâches', Icon: FaCheckSquare, tone: 'from-emerald-500 to-emerald-600' },
    { href: '/kanban', label: 'task_tracking', fb: 'Suivi', Icon: FaColumns, tone: 'from-teal-500 to-cyan-600' },
    { href: '/sprints', label: 'sprints', fb: 'Sprints', Icon: FaBolt, tone: 'from-amber-500 to-orange-500' },
    { href: '/files', label: 'files', fb: 'Fichiers', Icon: FaFileAlt, tone: 'from-sky-500 to-sky-600' },
  ] },
  { title: 'Équipe & échanges', items: [
    { href: '/discussions', label: 'discussions', fb: 'Discussions', Icon: FaComments, tone: 'from-pink-500 to-rose-500' },
    { href: '/project-users', label: 'members', fb: 'Membres', Icon: FaUserFriends, tone: 'from-violet-500 to-purple-600' },
    { href: '/users', label: 'users', fb: 'Utilisateurs', Icon: FaUsers, tone: 'from-slate-500 to-slate-700' },
    { href: '/recruitment', label: 'recruitment', fb: 'Recrutement', Icon: FaBullseye, tone: 'from-red-500 to-rose-600' },
  ] },
  { title: 'Évaluation & suivi', items: [
    { href: '/quizzes', label: 'quiz', fb: 'Quiz', Icon: FaQuestionCircle, tone: 'from-purple-500 to-fuchsia-600' },
    { href: '/activities', label: 'activity_log', fb: 'Journal', Icon: FaHistory, tone: 'from-cyan-500 to-blue-600' },
  ] },
  { title: 'Compte', items: [
    { href: '/subscription/plans', label: 'my_subscription', fb: 'Abonnement', Icon: FaCreditCard, tone: 'from-lime-500 to-green-600' },
    { href: '/remunerations/dashboard', label: 'remunerations', fb: 'Rémunérations', Icon: FaCoins, tone: 'from-yellow-500 to-amber-600' },
  ] },
];

export default function MobileMoreIndex() {
  const { t } = useTranslation();
  const { auth } = usePage().props;
  const user = auth?.user || auth || {};
  const candidateOnly = Boolean(auth?.user?.quiz_candidate_only);
  const [q, setQ] = useState('');
  const [dark, setDark] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false));

  const label = (i) => t(i.label) || i.fb;
  const groups = useMemo(() => GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => (!candidateOnly || i.href === '/quizzes') && (!q || label(i).toLowerCase().includes(q.toLowerCase()))) }))
    .filter((g) => g.items.length), [q, candidateOnly, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDark = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('darkMode', String(next)); nativeFeedback.tap?.(); };
  const logout = async () => { try { await unregisterDeviceToken(); } catch { /* ne bloque jamais la déconnexion */ } router.post('/logout'); };

  return (
    <MobileLayout title="Menu">
      <div className="space-y-5 py-4">
        <Link href="/profile" onClick={() => nativeFeedback.tap?.()} className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white shadow-lg transition active:scale-[.985]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <Avatar name={user.name || 'Utilisateur'} src={user.profile_photo_url} size="xl" ring="ring-4 ring-white/30" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold">{user.name || 'Utilisateur'}</p>
              <p className="truncate text-xs text-blue-100">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{candidateOnly ? 'Candidat' : 'Mon profil'} <FaChevronRight className="text-[8px]" /></span>
            </div>
          </div>
        </Link>

        {!candidateOnly && (
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans le menu" className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-[15px] shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white dark:ring-slate-800" />
          </div>
        )}

        {groups.map((g) => (
          <section key={g.title}>
            <h3 className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{g.title}</h3>
            <div className="grid grid-cols-3 gap-3">
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} onClick={() => nativeFeedback.tap?.()} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 transition active:scale-95 dark:bg-slate-900 dark:ring-slate-800">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${i.tone} text-xl text-white shadow-md`}><i.Icon /></span>
                  <span className="line-clamp-2 text-[11.5px] font-bold leading-tight text-slate-700 dark:text-slate-200">{label(i)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucune rubrique ne correspond.</p>}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <button type="button" onClick={toggleDark} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 dark:active:bg-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{dark ? <FaSun /> : <FaMoon />}</span>
            <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">{dark ? 'Mode clair' : 'Mode sombre'}</span>
            <span className={`relative h-7 w-12 rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} /></span>
          </button>
          <Link href="/profile" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3.5 active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FaCog /></span>
            <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">Paramètres du compte</span>
            <FaChevronRight className="text-xs text-slate-300" />
          </Link>
        </section>

        <button type="button" onClick={logout} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 text-sm font-extrabold text-rose-600 transition active:scale-[.98] dark:bg-rose-950/30 dark:text-rose-400"><FaSignOutAlt /> Déconnexion</button>
        <p className="pb-2 text-center text-[11px] font-semibold text-slate-400">ProJA v2.3.1</p>
      </div>
    </MobileLayout>
  );
}
