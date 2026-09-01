import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { FaArrowRight, FaCheck, FaClock, FaFileAlt, FaFire, FaProjectDiagram, FaTasks, FaUsers } from 'react-icons/fa';

const statItems = [
  { key: 'tasks', label: 'Taches', icon: FaTasks, tone: 'bg-blue-600', href: '/tasks' },
  { key: 'projects', label: 'Projets', icon: FaProjectDiagram, tone: 'bg-emerald-600', href: '/projects' },
  { key: 'members', label: 'Equipe', icon: FaUsers, tone: 'bg-orange-500', href: '/users' },
  { key: 'files', label: 'Fichiers', icon: FaFileAlt, tone: 'bg-violet-600', href: '/files' },
];

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';

export default function MobileDashboard({ auth: authProp, stats = {}, recentActivities = [], recentProjects = [] }) {
  const auth = authProp || {};
  const user = auth.user || auth;
  const firstName = user?.name?.split(' ')[0] || 'vous';
  const tasksByStatus = stats.tasksByStatus || {};

  return (
    <MobileLayout title="Accueil" subtitle={`Bonjour ${firstName}`} fullBleed>
      <Head title="Accueil" />
      <div className="min-h-full bg-slate-50 pb-5 dark:bg-slate-950">
        <section className="bg-slate-950 px-5 pb-6 pt-5 text-white dark:bg-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Votre espace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Bon retour, {firstName}</h2>
            </div>
            <Link href="/profile" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold ring-4 ring-white/10 active:scale-95">
              {initials(user?.name)}
            </Link>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-400">Taches terminees</p>
              <p className="mt-1 text-4xl font-bold">{tasksByStatus.done || 0}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300">
              <FaFire /> Votre rythme
            </div>
          </div>
        </section>

        <main className="space-y-6 px-4 pt-5">
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Vue d'ensemble</h3>
              <Link href="/activities" className="text-xs font-semibold text-blue-600 dark:text-blue-400">Tout voir</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statItems.map(({ key, label, icon: Icon, tone, href }) => (
                <Link key={key} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[.98] dark:border-slate-800 dark:bg-slate-900">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${tone}`}><Icon /></div>
                  <p className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">{stats[key] || 0}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Projets recents</h3>
              <Link href="/projects" className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ouvrir</Link>
            </div>
            <div className="space-y-2">
              {recentProjects.slice(0, 4).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials(project.name)}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{project.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{project.task_count || 0} taches</p></div>
                  <FaArrowRight className="flex-shrink-0 text-xs text-slate-400" />
                </Link>
              ))}
              {!recentProjects.length && <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">Aucun projet recent</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-blue-600 p-5 text-white shadow-lg shadow-blue-600/20">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><FaClock /></div><div><p className="text-sm font-bold">Restez organise</p><p className="mt-1 text-xs text-blue-100">Consultez vos taches du jour.</p></div></div>
            <Link href="/tasks" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-blue-700 active:scale-[.98]">Voir mes taches <FaArrowRight className="text-xs" /></Link>
          </section>

          {recentActivities.length > 0 && <section><h3 className="mb-3 px-1 text-base font-bold text-slate-900 dark:text-white">Activite recente</h3><div className="space-y-3">{recentActivities.slice(0, 3).map((activity) => <div key={activity.id} className="flex gap-3 px-1"><div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600 dark:bg-emerald-950"><FaCheck /></div><p className="text-sm text-slate-600 dark:text-slate-300"><b>{activity.user?.name || 'Utilisateur'}</b> {activity.description}</p></div>)}</div></section>}
        </main>
      </div>
    </MobileLayout>
  );
}
