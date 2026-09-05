// resources/js/Pages/Mobile/Dashboard.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import {
  FaArrowRight, FaCheck, FaClock, FaFileAlt, FaFire, FaProjectDiagram,
  FaTasks, FaUsers, FaChevronRight, FaDownload, FaUserPlus,
} from 'react-icons/fa';

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'P';

// ─── Petite pastille de statut avec barre de progression ────────────────────
const StatusRow = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-slate-600">{label}</span>
        <span className="text-[13px] font-bold text-slate-900">{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Carte de section réutilisable ──────────────────────────────────────────
const SectionCard = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-[18px] ${className}`}>
    <div className="flex items-center justify-between gap-2 mb-4">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const SeeAllLink = ({ href, label = 'Tout voir' }) => (
  <Link href={href} className="text-xs font-semibold text-blue-600 inline-flex items-center gap-0.5 active:opacity-60">
    {label} <FaChevronRight className="h-2.5 w-2.5" />
  </Link>
);

export default function MobileDashboard({
  auth: authProp,
  stats = {},
  recentActivities = [],
  recentProjects = [],
  recentFiles = [],
  topUsers = [],
}) {
  const auth = authProp || {};
  const user = auth.user || auth;
  const firstName = user?.name?.split(' ')[0] || 'vous';
  const isAdmin = user?.roles?.includes?.('admin');

  const tasksByStatus = stats.tasksByStatus || { todo: 0, in_progress: 0, done: 0, en_attente: 0 };
  const totalTasks = tasksByStatus.todo + tasksByStatus.in_progress + tasksByStatus.done + tasksByStatus.en_attente;

  const statItems = [
    { key: 'tasks', label: 'Tâches', icon: FaTasks, tone: 'bg-blue-600', href: '/tasks', show: true },
    { key: 'projects', label: 'Projets', icon: FaProjectDiagram, tone: 'bg-emerald-600', href: '/projects', show: true },
    { key: 'members', label: 'Équipe', icon: FaUsers, tone: 'bg-orange-500', href: '/users', show: isAdmin },
    { key: 'files', label: 'Fichiers', icon: FaFileAlt, tone: 'bg-violet-600', href: '/files', show: true },
  ].filter((s) => s.show !== false);

  const quickActions = [
    { icon: FaTasks, label: 'Nouvelle tâche', href: '/tasks/create' },
    { icon: FaProjectDiagram, label: 'Nouveau projet', href: '/projects/create' },
    { icon: FaUserPlus, label: 'Ajouter un membre', href: '/users/create', show: isAdmin },
    { icon: FaFileAlt, label: 'Importer', href: '/files/upload' },
  ].filter((a) => a.show !== false);

  return (
    <MobileLayout title="Accueil" subtitle={`Bonjour ${firstName}`} fullBleed>
      <Head title="Accueil" />

      <div className="min-h-full bg-slate-50 pb-6">

        {/* ─── Hero : header avec salutation et stat principale ─── */}
        <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-5 pb-7 pt-5 text-white rounded-b-[28px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Votre espace
              </p>
              <h2 className="mt-1 text-[22px] font-extrabold tracking-tight leading-tight">
                Bon retour, {firstName}
              </h2>
            </div>
            <Link
              href="/profile"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold ring-4 ring-white/10 active:scale-95 transition-transform"
            >
              {initials(user?.name)}
            </Link>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-[13px] text-slate-400">Tâches terminées</p>
              <p className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">
                {tasksByStatus.done || 0}
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300">
              <FaFire className="h-3 w-3" /> Votre rythme
            </div>
          </div>
        </section>

        <main className="space-y-5 px-4 pt-5">

          {/* ─── Accès rapide ─── */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {quickActions.map(({ icon: Icon, label, href }, i) => (
              <Link
                key={i}
                href={href}
                className="flex flex-col items-center gap-2 w-[76px] flex-shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-white border border-slate-100 shadow-sm text-blue-600 flex items-center justify-center text-base">
                  <Icon />
                </div>
                <span className="text-[10.5px] font-medium text-slate-600 text-center leading-tight line-clamp-2">
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* ─── Grille de stats ─── */}
          <div className="grid grid-cols-2 gap-3">
            {statItems.map(({ key, label, icon: Icon, tone, href }) => (
              <Link
                key={key}
                href={href}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm active:scale-[.98] transition-transform"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${tone}`}>
                  <Icon className="text-sm" />
                </div>
                <p className="mt-3.5 text-2xl font-extrabold text-slate-950">{stats[key] || 0}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </Link>
            ))}
          </div>

          {/* ─── Répartition des tâches ─── */}
          {totalTasks > 0 && (
            <SectionCard title="Répartition des tâches">
              <div className="space-y-3.5">
                <StatusRow label="À faire" count={tasksByStatus.todo} total={totalTasks} color="bg-blue-500" />
                <StatusRow label="En cours" count={tasksByStatus.in_progress} total={totalTasks} color="bg-amber-500" />
                <StatusRow label="Terminées" count={tasksByStatus.done} total={totalTasks} color="bg-emerald-500" />
                <StatusRow label="En attente" count={tasksByStatus.en_attente} total={totalTasks} color="bg-slate-400" />
              </div>
            </SectionCard>
          )}

          {/* ─── Projets récents ─── */}
          <div>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-[15px] font-bold text-slate-900">Projets récents</h3>
              <SeeAllLink href="/projects" label="Ouvrir" />
            </div>

            {recentProjects.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="w-[230px] flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[.98] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <h4 className="font-bold text-sm text-slate-900 truncate min-w-0">{project.name}</h4>
                      {project.status && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 whitespace-nowrap flex-shrink-0">
                          {project.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3.5 line-clamp-2 leading-relaxed">
                      {project.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-50">
                      {project.manager ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {project.manager.avatar ? (
                            <img src={project.manager.avatar} alt={project.manager.name} className="w-5 h-5 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] text-slate-500 font-semibold">{initials(project.manager.name)}</span>
                            </div>
                          )}
                          <span className="text-slate-600 truncate font-medium">{project.manager.name}</span>
                        </div>
                      ) : <span />}
                      <span className="text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                        {project.task_count || 0} tâches
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white border border-slate-100 p-6 text-center text-sm text-slate-400">
                Aucun projet récent
              </p>
            )}
          </div>

          {/* ─── Membres actifs ─── */}
          {topUsers.length > 0 && (
            <SectionCard title="Membres actifs">
              <div className="space-y-4">
                {topUsers.map((u, index) => (
                  <div key={u.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                            <span className="text-slate-500 text-xs font-bold">{initials(u.name)}</span>
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.count} activités</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 flex-shrink-0">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ─── Bannière CTA ─── */}
          <section className="rounded-3xl bg-gradient-to-b from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-600/25">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 flex-shrink-0">
                <FaClock />
              </div>
              <div>
                <p className="text-[15px] font-bold">Restez organisé</p>
                <p className="mt-0.5 text-xs text-blue-100">Consultez vos tâches du jour.</p>
              </div>
            </div>
            <Link
              href="/tasks"
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[14px] font-bold text-blue-700 active:scale-[.98] transition-transform"
            >
              Voir mes tâches <FaArrowRight className="text-xs" />
            </Link>
          </section>

          {/* ─── Fichiers récents ─── */}
{/* ─── Fichiers récents ─── */}
{recentFiles.length > 0 && (
    <SectionCard title="Fichiers récents" action={<SeeAllLink href="/files" />}>
        <div className="divide-y divide-slate-50">
            {recentFiles.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center gap-3 py-3 -mx-1.5 px-1.5 rounded-xl"
                >
                    <Link
                        href={`/files/${file.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1 active:bg-slate-50 transition-colors"
                    >
                        <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                            <FaFileAlt className="text-blue-500 text-sm" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {file.name}
                            </p>

                            <p className="text-xs text-slate-500 truncate">
                                {file.size} · {file.created_at}
                            </p>
                        </div>
                    </Link>

                    {file.url && (
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 p-2 flex-shrink-0 active:scale-90 transition-transform"
                            title="Télécharger"
                        >
                            <FaDownload className="text-sm" />
                        </a>
                    )}
                </div>
            ))}
        </div>
    </SectionCard>
)}

          {/* ─── Activité récente ─── */}
          {recentActivities.length > 0 && (
            <SectionCard title="Activité récente" action={<SeeAllLink href="/activities" />}>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Wrapper = activity.url ? Link : 'div';
                  const wrapperProps = activity.url ? { href: activity.url } : {};
                  return (
                    <Wrapper key={activity.id} {...wrapperProps} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        {activity.user?.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <FaCheck className="text-[10px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug break-words">
                          <span className="font-semibold text-slate-900">
                            {activity.user?.name || 'Utilisateur'}
                          </span>{' '}
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{activity.created_at}</p>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </main>
      </div>
    </MobileLayout>
  );
}