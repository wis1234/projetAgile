// resources/js/Pages/Mobile/Dashboard.jsx
import React, { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  FaBell, FaBolt, FaChevronRight, FaComments, FaDownload, FaFileAlt, FaFolderOpen,
  FaProjectDiagram, FaQuestionCircle, FaTasks, FaUsers, FaColumns, FaPlus,
} from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MEmpty, asList } from '@/Components/Mobile/kit';

// ─── Libellés et couleurs des statuts de projet (le serveur envoie « en_cours », « termine »…) ───
const PROJECT_STATUS = {
  nouveau: { label: 'Nouveau', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', bar: 'from-slate-400 to-slate-500' },
  demarrage: { label: 'Démarrage', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-400 to-teal-500' },
  en_cours: { label: 'En cours', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', bar: 'from-amber-400 to-orange-500' },
  avance: { label: 'Avancé', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', bar: 'from-blue-400 to-indigo-500' },
  termine: { label: 'Terminé', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-500 to-green-600' },
  suspendu: { label: 'Suspendu', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', bar: 'from-red-400 to-rose-500' },
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Bonsoir';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const todayLabel = () => {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ─── Anneau de progression ──────────────────────────────────────────────────
function ProgressRing({ pct, size = 88, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Avancement ${pct} %`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-black">{pct}<span className="text-xs font-bold text-white/80">%</span></span>
    </div>
  );
}

// ─── Blocs réutilisables ────────────────────────────────────────────────────
const Panel = ({ title, action, children, className = '' }) => (
  <section className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    {(title || action) && (
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{title}</h3>
        {action}
      </div>
    )}
    {children}
  </section>
);

const SeeAll = ({ href, label = 'Tout voir' }) => (
  <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 active:opacity-60 dark:text-blue-400">
    {label} <FaChevronRight className="h-2.5 w-2.5" />
  </Link>
);

export default function MobileDashboard({
  auth: authProp,
  stats = {},
  activityByDay = [],
  recentActivities = [],
  recentProjects = [],
  recentFiles = [],
  topUsers = [],
}) {
  const page = usePage();
  const auth = authProp || page.props.auth || {};
  const user = auth.user || auth;
  const firstName = user?.name?.split(' ')[0] || 'vous';
  const unread = Number(user?.unreadNotificationsCount || 0);

  const by = stats.tasksByStatus || {};
  const todo = by.todo || 0;
  const inProgress = by.in_progress || 0;
  const done = by.done || 0;
  const waiting = by.en_attente || 0;
  const totalTasks = todo + inProgress + done + waiting;
  const pct = totalTasks ? Math.round((done / totalTasks) * 100) : 0;

  const projects = asList(recentProjects);
  const files = asList(recentFiles);
  const activities = asList(recentActivities);
  const people = asList(topUsers);

  // Activité des 14 derniers jours (jours sans activité = 0)
  const activity = useMemo(() => {
    const counts = new Map(asList(activityByDay).map((d) => [String(d.day).slice(0, 10), Number(d.count) || 0]));
    const days = Array.from({ length: 14 }, (_, i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - (13 - i));
      const key = dt.toISOString().slice(0, 10);
      return { key, count: counts.get(key) || 0, label: dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }) };
    });
    return { days, total: days.reduce((a, d) => a + d.count, 0), max: Math.max(1, ...days.map((d) => d.count)) };
  }, [activityByDay]);

  const kpis = [
    { label: 'Tâches', value: stats.tasks ?? totalTasks, icon: FaTasks, tone: 'from-blue-500 to-blue-600', href: '/tasks' },
    { label: 'Projets', value: stats.projects ?? projects.length, icon: FaProjectDiagram, tone: 'from-emerald-500 to-teal-600', href: '/projects' },
    { label: 'Équipe', value: stats.members ?? stats.users ?? 0, icon: FaUsers, tone: 'from-orange-400 to-orange-500' },
    { label: 'Fichiers', value: stats.files ?? files.length, icon: FaFileAlt, tone: 'from-violet-500 to-purple-600', href: '/files' },
  ];

  const shortcuts = [
    { label: 'Nouvelle tâche', icon: FaPlus, tone: 'from-blue-500 to-indigo-600', href: '/tasks/create' },
    { label: 'Suivi', icon: FaColumns, tone: 'from-amber-400 to-orange-500', href: '/kanban' },
    { label: 'Quiz', icon: FaQuestionCircle, tone: 'from-fuchsia-500 to-purple-600', href: '/quizzes' },
    { label: 'Discussions', icon: FaComments, tone: 'from-emerald-500 to-teal-600', href: '/discussions' },
  ];

  const segments = [
    { label: 'À faire', count: todo, cls: 'bg-blue-500' },
    { label: 'En cours', count: inProgress, cls: 'bg-amber-500' },
    { label: 'Terminées', count: done, cls: 'bg-emerald-500' },
    { label: 'En attente', count: waiting, cls: 'bg-slate-400' },
  ];

  const empty = !totalTasks && !projects.length;

  return (
    <MobileLayout title="Accueil" fullBleed hideHeader>
      <Head title="Accueil" />

      <div className="min-h-full shrink-0 pb-6">
        {/* ─── Bandeau : salutation, notifications, avancement global ─── */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-5 pb-20 text-white"
          style={{ marginTop: 'calc(-1 * var(--safe-top))', paddingTop: 'calc(var(--safe-top) + 1.25rem)' }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/[0.07]" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/profile" aria-label="Mon profil" className="flex-shrink-0 active:scale-95 transition-transform">
                <Avatar name={user?.name} src={user?.profile_photo_url} size="lg" ring="ring-2 ring-white/40" />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white/70">{todayLabel()}</p>
                <h1 className="truncate text-xl font-extrabold leading-tight">{greeting()}, {firstName}</h1>
              </div>
            </div>
            <Link href="/notifications" aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
              className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-base backdrop-blur active:scale-95 transition-transform">
              <FaBell />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold ring-2 ring-indigo-600">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </div>

          <div className="relative mt-6 flex items-center gap-5">
            <ProgressRing pct={pct} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">Avancement des tâches</p>
              <p className="mt-0.5 text-3xl font-black leading-none">
                {done}<span className="text-base font-semibold text-white/70"> / {totalTasks}</span>
              </p>
              <p className="mt-1.5 text-xs text-white/75">{inProgress} en cours · {todo} à faire</p>
            </div>
          </div>
        </section>

        <div className="relative z-10 -mt-12 space-y-5 px-4">
          {/* ─── Chiffres clés (carte flottante sur le bandeau) ─── */}
          <div className="grid grid-cols-4 rounded-3xl bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            {kpis.map(({ label, value, icon: Icon, tone, href }) => {
              const body = (
                <>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm text-white shadow-sm ${tone}`}><Icon /></span>
                  <span className="mt-2 text-lg font-extrabold leading-none text-slate-900 dark:text-white">{value}</span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
                </>
              );
              const cls = 'flex min-w-0 flex-col items-center rounded-2xl px-1 py-3 transition active:bg-slate-50 dark:active:bg-slate-800';
              return href ? <Link key={label} href={href} className={cls}>{body}</Link> : <div key={label} className={cls}>{body}</div>;
            })}
          </div>

          {/* ─── Raccourcis ─── */}
          <div className="grid grid-cols-4 gap-2.5">
            {shortcuts.map(({ label, icon: Icon, tone, href }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-2 rounded-2xl py-1 active:scale-95 transition-transform">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg text-white shadow-md ${tone}`}><Icon /></span>
                <span className="text-center text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-300">{label}</span>
              </Link>
            ))}
          </div>

          {empty && (
            <MEmpty icon={FaFolderOpen} title="Bienvenue sur ProJA" text="Créez votre premier projet pour commencer à organiser vos tâches."
              action={<Link href="/projects/create" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white">Créer un projet</Link>} />
          )}

          {/* ─── Répartition des tâches : une seule barre empilée ─── */}
          {totalTasks > 0 && (
            <Panel title="Répartition des tâches" action={<SeeAll href="/kanban" label="Suivi" />}>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img"
                aria-label={segments.map((s) => `${s.label} : ${s.count}`).join(', ')}>
                {segments.filter((s) => s.count > 0).map((s) => (
                  <div key={s.label} className={`${s.cls} h-full transition-all duration-700`} style={{ width: `${(s.count / totalTasks) * 100}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${s.cls}`} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600 dark:text-slate-300">{s.label}</span>
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* ─── Activité des 14 derniers jours ─── */}
          {activity.total > 0 && (
            <Panel title="Activité · 14 jours" action={<span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{activity.total} action{activity.total > 1 ? 's' : ''}</span>}>
              <div className="flex h-24 items-end gap-1" role="img" aria-label={`${activity.total} actions sur 14 jours`}>
                {activity.days.map((d) => (
                  <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.label} : ${d.count}`}>
                    <div className={`w-full rounded-t-md ${d.count ? 'bg-gradient-to-t from-blue-500 to-indigo-400' : 'bg-slate-100 dark:bg-slate-800'}`}
                      style={{ height: d.count ? `${Math.max(12, (d.count / activity.max) * 100)}%` : '6%' }} />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* ─── Projets récents ─── */}
          {projects.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Projets récents</h3>
                <SeeAll href="/projects" label="Ouvrir" />
              </div>
              <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2" data-no-ptr>
                {projects.map((project) => {
                  const st = PROJECT_STATUS[project.status] || { label: project.status || '—', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', bar: 'from-slate-400 to-slate-500' };
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}
                      className="relative w-[78%] max-w-[280px] flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 pt-5 shadow-sm active:scale-[.985] transition-transform dark:border-slate-800 dark:bg-slate-900">
                      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${st.bar}`} />
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">{project.name}</h4>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {project.description || 'Aucune description'}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {project.manager && <Avatar name={project.manager.name} src={project.manager.avatar} size="xs" />}
                          <span className="truncate font-medium text-slate-600 dark:text-slate-300">{project.manager?.name || '—'}</span>
                        </span>
                        <span className="flex-shrink-0 font-semibold text-slate-400"><FaTasks className="mr-1 inline text-[10px]" />{project.task_count || 0}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Activité récente ─── */}
          {activities.length > 0 && (
            <Panel title="Activité récente" action={<SeeAll href="/activities" />}>
              <ul className="space-y-4">
                {activities.slice(0, 5).map((a) => {
                  const Wrapper = a.url ? Link : 'div';
                  return (
                    <li key={a.id}>
                      <Wrapper {...(a.url ? { href: a.url } : {})} className="flex items-start gap-3">
                        <Avatar name={a.user?.name} src={a.user?.avatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-900 dark:text-white">{a.user?.name || 'Utilisateur'}</span> {a.description}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{a.created_at}</p>
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}

          {/* ─── Fichiers récents ─── */}
          {files.length > 0 && (
            <Panel title="Fichiers récents" action={<SeeAll href="/files" />}>
              <ul className="-my-1 divide-y divide-slate-100 dark:divide-slate-800">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center gap-3 py-2.5">
                    <Link href={`/files/${file.id}`} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/40"><FaFileAlt /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[file.size, file.created_at].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                    {file.url && (
                      <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Télécharger ${file.name}`}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950/40">
                        <FaDownload className="text-sm" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* ─── Membres actifs ─── */}
          {people.length > 0 && (
            <Panel title="Membres actifs">
              <ul className="space-y-3.5">
                {people.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <span className={`w-5 text-center text-xs font-black ${i === 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>{i + 1}</span>
                    <Avatar name={u.name} src={u.avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400"><FaBolt className="mr-1 inline text-[10px] text-amber-500" />{u.count} activités</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
