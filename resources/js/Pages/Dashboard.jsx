import React, { memo, useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, ArcElement, Filler,
} from 'chart.js';
import {
  FaTasks, FaUsers, FaProjectDiagram, FaFileAlt, FaChevronRight, FaDownload,
  FaUserPlus, FaPlus, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFileArchive,
} from 'react-icons/fa';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../Layouts/AdminLayout';
import RecruitmentCard from '@/Components/RecruitmentCard';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, ArcElement, Filler);

/* ─────────────────────────────────────────────────────────────
   Design tokens
   Une seule couleur d'accent (indigo), neutres ardoise, rayons cohérents.
   Police : Plus Jakarta Sans (titres + texte), chiffres tabulaires.
   ───────────────────────────────────────────────────────────── */

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';

const STATUS = {
  todo:        { key: 'status_todo',        def: 'À faire',    hex: '#6366f1', bar: 'bg-indigo-500' },
  in_progress: { key: 'status_in_progress', def: 'En cours',   hex: '#f59e0b', bar: 'bg-amber-500' },
  done:        { key: 'status_done',        def: 'Terminées',  hex: '#10b981', bar: 'bg-emerald-500' },
  en_attente:  { key: 'status_pending',     def: 'En attente', hex: '#94a3b8', bar: 'bg-slate-400' },
};
const STATUS_ORDER = ['todo', 'in_progress', 'done', 'en_attente'];

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  sky:    'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  amber:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
};

const FILE_ICONS = {
  pdf: [FaFilePdf, 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'],
  doc: [FaFileWord, 'text-sky-600 bg-sky-50 dark:bg-sky-500/10'],
  docx: [FaFileWord, 'text-sky-600 bg-sky-50 dark:bg-sky-500/10'],
  xls: [FaFileExcel, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'],
  xlsx: [FaFileExcel, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'],
  csv: [FaFileExcel, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'],
  png: [FaFileImage, 'text-violet-500 bg-violet-50 dark:bg-violet-500/10'],
  jpg: [FaFileImage, 'text-violet-500 bg-violet-50 dark:bg-violet-500/10'],
  jpeg: [FaFileImage, 'text-violet-500 bg-violet-50 dark:bg-violet-500/10'],
  webp: [FaFileImage, 'text-violet-500 bg-violet-50 dark:bg-violet-500/10'],
  zip: [FaFileArchive, 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'],
  rar: [FaFileArchive, 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'],
};
const FILE_FALLBACK = [FaFileAlt, 'text-slate-500 bg-slate-100 dark:bg-slate-700/50'];
const fileIcon = (name = '') => FILE_ICONS[name.split('.').pop()?.toLowerCase()] || FILE_FALLBACK;

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950';

/* ─────────────────────────────────────────────────────────────
   Hooks utilitaires
   ───────────────────────────────────────────────────────────── */

function useIsDark() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ─────────────────────────────────────────────────────────────
   Briques UI (mémoïsées)
   ───────────────────────────────────────────────────────────── */

const Card = memo(function Card({ title, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 min-w-0 ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
});

const SeeAll = memo(function SeeAll({ href, label }) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 ${focusRing}`}
    >
      {label} <FaChevronRight className="h-2.5 w-2.5" />
    </Link>
  );
});

const Avatar = memo(function Avatar({ user, size = 'h-9 w-9', text = 'text-sm' }) {
  const name = user?.name || '?';
  return user?.avatar ? (
    <img
      src={user.avatar}
      alt={name}
      loading="lazy"
      decoding="async"
      className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 font-semibold text-indigo-700 ring-2 ring-white dark:from-indigo-500/20 dark:to-slate-700 dark:text-indigo-200 dark:ring-slate-900`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
});

const StatCard = memo(function StatCard({ title, count, tone, link, icon: Icon }) {
  return (
    <Link
      href={link}
      className={`group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${focusRing}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="text-lg" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
          {count}
        </span>
        <span className="mt-1.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
      </span>
      <FaChevronRight className="ml-auto h-3 w-3 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600" />
    </Link>
  );
});

const QuickAction = memo(function QuickAction({ href, icon: Icon, label, primary }) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.97] ${focusRing} ${
        primary
          ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="h-3 w-3" /> {label}
    </Link>
  );
});

const Empty = ({ children }) => (
  <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">{children}</p>
);

/* ─────────────────────────────────────────────────────────────
   Plugin Chart.js : total au centre du donut
   ───────────────────────────────────────────────────────────── */

const centerText = {
  id: 'centerText',
  afterDraw(chart, _args, opts) {
    const { ctx, chartArea } = chart;
    if (!chartArea || opts?.value == null) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.color;
    ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(String(opts.value), cx, cy - 8);
    ctx.fillStyle = opts.subColor;
    ctx.font = '500 11px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(opts.label, cx, cy + 14);
    ctx.restore();
  },
};

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

const EMPTY_STATUS = { todo: 0, in_progress: 0, done: 0, en_attente: 0 };

export default function Dashboard({
  auth,
  stats = {},
  activityByDay = [],
  recentActivities = [],
  topUsers = [],
  recentProjects = [],
  recentFiles = [],
}) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const dark = useIsDark();
  const locale = i18n.language || 'fr';
  const isAdmin = auth?.user?.roles?.includes('admin');
  const tasksByStatus = { ...EMPTY_STATUS, ...(stats.tasksByStatus || {}) };

  /* En-tête */
  const today = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
    [locale]
  );
  const firstName = auth?.user?.name?.split(' ')[0];

  /* Widgets */
  const widgets = useMemo(
    () =>
      [
        { title: t('tasks'), count: stats.tasks ?? 0, tone: 'indigo', link: '/tasks', icon: FaTasks, show: true },
        { title: t('projects'), count: stats.projects ?? 0, tone: 'sky', link: '/projects', icon: FaProjectDiagram, show: true },
        { title: t('team_members'), count: stats.members ?? 0, tone: 'violet', link: '/users', icon: FaUsers, show: isAdmin },
        { title: t('files'), count: stats.files ?? 0, tone: 'amber', link: '/files', icon: FaFileAlt, show: true },
      ].filter((w) => w.show),
    [t, stats.tasks, stats.projects, stats.members, stats.files, isAdmin]
  );

  /* Palette des graphiques (clair / sombre) */
  const tick = dark ? '#94a3b8' : '#64748b';
  const grid = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.05)';

  /* Courbe d'activité */
  const activityChart = useMemo(
    () => ({
      labels: activityByDay.map((a) =>
        new Date(a.day).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
      ),
      datasets: [
        {
          label: t('activities', { defaultValue: 'Activités' }),
          data: activityByDay.map((a) => a.count),
          borderColor: '#6366f1',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            if (!chart.chartArea) return 'rgba(99,102,241,0.1)';
            const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
            g.addColorStop(0, 'rgba(99,102,241,0.28)');
            g.addColorStop(1, 'rgba(99,102,241,0)');
            return g;
          },
        },
      ],
    }),
    [activityByDay, locale, t]
  );

  const activityOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: grid },
          ticks: { stepSize: 1, color: tick, font: { size: 11 }, padding: 8 },
        },
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: { color: tick, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        },
      },
    }),
    [grid, tick]
  );

  /* Donut des tâches */
  const totalTasks = STATUS_ORDER.reduce((sum, k) => sum + (tasksByStatus[k] || 0), 0);

  const donutData = useMemo(
    () => ({
      labels: STATUS_ORDER.map((k) => t(STATUS[k].key, { defaultValue: STATUS[k].def })),
      datasets: [
        {
          data: STATUS_ORDER.map((k) => tasksByStatus[k] || 0),
          backgroundColor: STATUS_ORDER.map((k) => STATUS[k].hex),
          borderWidth: 3,
          borderColor: dark ? '#0f172a' : '#ffffff',
          hoverOffset: 4,
          borderRadius: 4,
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, dark, tasksByStatus.todo, tasksByStatus.in_progress, tasksByStatus.done, tasksByStatus.en_attente]
  );

  const donutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '74%',
      plugins: {
        legend: { display: false },
        centerText: {
          value: totalTasks,
          label: t('tasks'),
          color: dark ? '#f8fafc' : '#0f172a',
          subColor: tick,
        },
      },
    }),
    [totalTasks, dark, tick, t]
  );

  /* Entrée de page : un seul mouvement orchestré */
  const enter = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: 'easeOut' } };

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </Head>

      <div
        className="min-h-screen w-full bg-slate-50 dark:bg-slate-950"
        style={{ fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' }}
      >
        <motion.div {...enter} className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

          {/* ── En-tête ───────────────────────────────────────── */}
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-medium capitalize text-slate-500 dark:text-slate-400">{today}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {firstName
                  ? t('welcome_back', { defaultValue: 'Bon retour, {{name}}', name: firstName })
                  : t('dashboard')}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('dashboard_subtitle')}</p>
            </div>
            <div className="w-full min-w-0 shrink-0 sm:w-64">
              <RecruitmentCard />
            </div>
          </header>

          {/* ── Accès rapide ──────────────────────────────────── */}
          <nav
            aria-label={t('quick_access')}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <QuickAction primary href="/tasks/create" icon={FaPlus} label={t('new_task')} />
            <QuickAction href="/projects/create" icon={FaProjectDiagram} label={t('new_project')} />
            <QuickAction href="/users/create" icon={FaUsers} label={t('add_member')} />
            <QuickAction href="/files/upload" icon={FaFileAlt} label={t('import_file')} />
            <QuickAction href="/recruitment" icon={FaUserPlus} label={t('recruitment_offers')} />
          </nav>

          {/* ── Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {widgets.map((w) => (
              <StatCard key={w.link} {...w} />
            ))}
          </div>

          {/* ── Activité + membres actifs ─────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title={t('recent_activity')} className="lg:col-span-2">
              <div className="h-60 sm:h-72">
                <Line data={activityChart} options={activityOptions} />
              </div>
            </Card>

            <Card title={t('active_team_members')}>
              {topUsers.length ? (
                <ul className="space-y-3.5">
                  {topUsers.map((u, i) => (
                    <li key={u.id} className="flex min-w-0 items-center gap-3">
                      <span className="relative shrink-0">
                        <Avatar user={u} size="h-10 w-10" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {u.count} {t('activities', { defaultValue: 'activités' })}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        #{i + 1}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>{t('no_recent_user_activity')}</Empty>
              )}
            </Card>
          </div>

          {/* ── Tâches + projets récents ──────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title={t('tasks_distribution', { defaultValue: 'Répartition des tâches' })}>
              <div className="mx-auto h-48 w-48">
                <Doughnut data={donutData} options={donutOptions} plugins={[centerText]} />
              </div>
              <ul className="mt-5 space-y-3">
                {STATUS_ORDER.map((k) => {
                  const count = tasksByStatus[k] || 0;
                  const pct = totalTasks ? Math.round((count / totalTasks) * 100) : 0;
                  return (
                    <li key={k}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {t(STATUS[k].key, { defaultValue: STATUS[k].def })}
                        </span>
                        <span className="tabular-nums text-slate-500 dark:text-slate-400">
                          <b className="font-semibold text-slate-900 dark:text-white">{count}</b> · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${STATUS[k].bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card
              title={t('recent_projects')}
              action={<SeeAll href="/projects" label={t('view_all_projects')} />}
              className="lg:col-span-2"
            >
              {recentProjects.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recentProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className={`group flex min-w-0 flex-col rounded-xl border border-slate-200/80 p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-500/50 ${focusRing}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                          {p.name}
                        </h3>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                        {p.description || t('no_description', { defaultValue: 'Aucune description' })}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar user={p.manager} size="h-6 w-6" text="text-[10px]" />
                          <span className="truncate text-slate-600 dark:text-slate-300">{p.manager?.name}</span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-slate-500 dark:text-slate-400">
                          {p.task_count} {t('tasks')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty>{t('no_recent_projects')}</Empty>
              )}
            </Card>
          </div>

          {/* ── Fichiers + activités récentes ─────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title={t('recent_files')} action={<SeeAll href="/files" label={t('view_all_files')} />}>
              {recentFiles.length ? (
                <ul className="-mx-2 space-y-0.5">
                  {recentFiles.map((f) => {
                    const [Icon, tone] = fileIcon(f.name);
                    return (
                      <li key={f.id} className="group flex min-w-0 items-center gap-1 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <Link href={`/files/${f.id}`} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 ${focusRing}`}>
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                            <Icon className="text-base" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {f.size} • {f.created_at}
                            </span>
                          </span>
                        </Link>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('download', { defaultValue: 'Télécharger' })}
                          aria-label={t('download', { defaultValue: 'Télécharger' })}
                          className={`mr-1 shrink-0 rounded-full p-2.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 ${focusRing}`}
                        >
                          <FaDownload className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty>{t('no_recent_files')}</Empty>
              )}
            </Card>

            <Card title={t('recent_activities')} action={<SeeAll href="/activities" label={t('view_all_activities')} />}>
              {recentActivities.length ? (
                <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[1.1rem] before:top-3 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                  {recentActivities.map((a) => {
                    const Wrapper = a.url ? Link : 'div';
                    return (
                      <li key={a.id} className="relative">
                        <Wrapper
                          {...(a.url ? { href: a.url } : {})}
                          className={`group -mx-2 flex min-w-0 items-start gap-3 rounded-xl p-2 transition-colors ${
                            a.url ? `hover:bg-slate-50 dark:hover:bg-slate-800/60 ${focusRing}` : ''
                          }`}
                        >
                          <Avatar user={a.user} size="h-8 w-8" text="text-xs" />
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block break-words text-sm leading-5 text-slate-700 dark:text-slate-200 ${
                                a.url ? 'transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300' : ''
                              }`}
                            >
                              <b className="font-semibold text-slate-900 dark:text-white">
                                {a.user?.name || t('unknown_user')}
                              </b>{' '}
                              {a.description}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">{a.created_at}</span>
                          </span>
                        </Wrapper>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <Empty>{t('no_recent_activity')}</Empty>
              )}
            </Card>
          </div>
        </motion.div>
      </div>
    </>
  );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;