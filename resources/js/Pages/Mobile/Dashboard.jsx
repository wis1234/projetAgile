import React from 'react';
import { Link } from '@inertiajs/react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { FaTasks, FaUsers, FaProjectDiagram, FaFileAlt, FaChevronRight, FaDownload, FaUserPlus, FaFire, FaClock, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import RecruitmentCard from '@/Components/RecruitmentCard';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

// ─── Carte stat compacte pour le scroll horizontal ──────────────────────────
const StatChip = ({ title, count, color, link, icon: Icon }) => {
  const content = (
    <div className="flex flex-col justify-between w-[128px] h-[104px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.97] transition-transform snap-start">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="text-sm text-white" />
      </div>
      <div>
        <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{count ?? 0}</p>
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
      </div>
    </div>
  );
  return link ? <Link href={link}>{content}</Link> : content;
};

// ─── Raccourci d'accès rapide (icône + libellé, en colonne) ─────────────────
const QuickAction = ({ icon, label, link }) => (
  <Link href={link} className="flex flex-col items-center gap-1.5 w-[72px] flex-shrink-0 snap-start active:scale-95 transition-transform">
    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-sm">
      {icon}
    </div>
    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight line-clamp-2">{label}</span>
  </Link>
);

const StatusBadge = ({ status, count, t }) => {
  const statusConfig = {
    todo: { label: t('status_todo'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    in_progress: { label: t('status_in_progress'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    done: { label: t('status_done'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    en_attente: { label: t('status_pending'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>{config.label}</span>
      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex-shrink-0">{count}</span>
    </div>
  );
};

const SectionCard = ({ title, action, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
    <div className="flex items-center justify-between gap-2 mb-3.5">
      <h2 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

export default function MobileDashboard({ auth: authProp, stats = {}, activityByDay = [], recentActivities = [], topUsers = [], recentProjects = [], recentFiles = [] }) {
  const { t } = useTranslation();
  const { auth: authShared } = usePage().props;
  const auth = authProp || authShared;
  const isAdmin = auth?.user?.roles?.includes('admin');
  const firstName = (auth?.user?.name || '').split(' ')[0];

  const tasksByStatus = stats.tasksByStatus || { todo: 0, in_progress: 0, done: 0, en_attente: 0 };

  const statsData = [
    { title: t('tasks'), count: stats.tasks || 0, color: 'bg-indigo-500', link: '/tasks', icon: FaTasks, show: true },
    { title: t('projects'), count: stats.projects || 0, color: 'bg-blue-500', link: '/projects', icon: FaProjectDiagram, show: true },
    { title: t('team_members'), count: stats.members || 0, color: 'bg-purple-500', link: '/users', icon: FaUsers, show: isAdmin },
    { title: t('files'), count: stats.files || 0, color: 'bg-amber-500', link: '/files', icon: FaFileAlt, show: true },
  ].filter(w => w.show !== false);

  const quickActions = [
    { icon: <FaTasks />, label: t('new_task'), link: '/tasks/create' },
    { icon: <FaProjectDiagram />, label: t('new_project'), link: '/projects/create' },
    { icon: <FaUsers />, label: t('add_member'), link: '/users/create' },
    { icon: <FaFileAlt />, label: t('import_file'), link: '/files/upload' },
    { icon: <FaUserPlus />, label: t('recruitment_offers'), link: '/recruitment' },
  ];

  const activityChartData = {
    labels: activityByDay.map(a => new Date(a.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Activités',
      data: activityByDay.map(a => a.count),
      borderColor: 'rgba(99, 102, 241, 0.8)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.3,
      fill: true,
    }],
  };

  const tasksByStatusData = {
    labels: ['À faire', 'En cours', 'Terminées', 'En attente'],
    datasets: [{
      data: [tasksByStatus.todo || 0, tasksByStatus.in_progress || 0, tasksByStatus.done || 0, tasksByStatus.en_attente || 0],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(156, 163, 175, 0.8)'],
      borderWidth: 0,
    }],
  };

  return (
    <MobileLayout title={t('dashboard')} subtitle={firstName ? `Bonjour, ${firstName}` : null} fullBleed>
      <div className="space-y-4 pb-4">

        {/* ─── Bannière recrutement ─── */}
        <div className="px-4 pt-3">
          <RecruitmentCard />
        </div>

        {/* ─── Stats en scroll horizontal ─── */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pl-4 pr-4 pb-0.5 scrollbar-hide">
          {statsData.map((w, i) => (
            <StatChip key={i} title={w.title} count={w.count} color={w.color} link={w.link} icon={w.icon} />
          ))}
        </div>

        {/* ─── Accès rapide en scroll horizontal ─── */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pl-4 pr-4 scrollbar-hide">
          {quickActions.map((a, i) => (
            <QuickAction key={i} icon={a.icon} label={a.label} link={a.link} />
          ))}
        </div>

        <div className="px-4 space-y-4">

          {/* ─── Activité récente ─── */}
          <SectionCard title={t('recent_activity')}>
            <div className="h-44">
              <Line
                data={activityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, font: { size: 9 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 } },
                  },
                }}
              />
            </div>
          </SectionCard>

          {/* ─── Répartition des tâches ─── */}
          <SectionCard title="Répartition des tâches">
            <div className="h-40 mb-2">
              <Pie
                data={tasksByStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              <StatusBadge status="todo" count={tasksByStatus.todo || 0} t={t} />
              <StatusBadge status="in_progress" count={tasksByStatus.in_progress || 0} t={t} />
              <StatusBadge status="done" count={tasksByStatus.done || 0} t={t} />
              <StatusBadge status="en_attente" count={tasksByStatus.en_attente || 0} t={t} />
            </div>
          </SectionCard>

          {/* ─── Membres actifs ─── */}
          <SectionCard title={t('active_team_members')}>
            {topUsers?.length > 0 ? (
              <div className="space-y-3.5">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.count} activités</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">#{index + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('no_recent_user_activity')}</p>
            )}
          </SectionCard>
        </div>

        {/* ─── Projets récents — carrousel horizontal ─── */}
        <div>
          <div className="flex items-center justify-between gap-2 px-4 mb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">{t('recent_projects')}</h2>
            <Link href="/projects" className="text-xs font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
              {t('view_all_projects')} <FaChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>

          {recentProjects?.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pl-4 pr-4 pb-1 scrollbar-hide">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="w-[240px] flex-shrink-0 snap-start bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="p-3.5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate min-w-0">{project.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap flex-shrink-0">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description || 'Aucune description'}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center min-w-0">
                        {project.manager.avatar ? (
                          <img src={project.manager.avatar} alt={project.manager.name} className="w-5 h-5 rounded-full mr-1.5 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-1.5 flex-shrink-0">
                            <span className="text-[9px] text-gray-500 dark:text-gray-400">{project.manager.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-gray-600 dark:text-gray-300 truncate">{project.manager.name}</span>
                      </div>
                      <span className="text-gray-400 whitespace-nowrap flex-shrink-0">{project.task_count} {t('tasks')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">{t('no_recent_projects')}</p>
          )}
        </div>

        <div className="px-4 space-y-4">

          {/* ─── Fichiers récents ─── */}
          <SectionCard
            title={t('recent_files')}
            action={<Link href="/files" className="text-xs font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">{t('view_all_files')} <FaChevronRight className="h-2.5 w-2.5" /></Link>}
          >
            {recentFiles?.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recentFiles.map((file) => (
                  <Link key={file.id} href={`/files/${file.id}`} className="flex items-center gap-3 py-2.5 active:bg-gray-50 dark:active:bg-gray-700/40 -mx-1 px-1 rounded-lg transition-colors">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FaFileAlt className="text-blue-500 dark:text-blue-400 text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{file.size} • {file.created_at}</p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 p-2 flex-shrink-0"
                      title="Télécharger"
                    >
                      <FaDownload className="text-sm" />
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('no_recent_files')}</p>
            )}
          </SectionCard>

          {/* ─── Activités récentes ─── */}
          <SectionCard
            title={t('recent_activities')}
            action={<Link href="/activities" className="text-xs font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">{t('view_all_activities')} <FaChevronRight className="h-2.5 w-2.5" /></Link>}
          >
            {recentActivities?.length > 0 ? (
              <div className="space-y-3.5">
                {recentActivities.map((activity) => {
                  const Wrapper = activity.url ? Link : 'div';
                  const wrapperProps = activity.url ? { href: activity.url } : {};
                  return (
                    <Wrapper key={activity.id} {...wrapperProps} className="flex items-start gap-2.5">
                      <div className="flex-shrink-0">
                        {activity.user?.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-[10px] font-medium">{activity.user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                          <span className="font-medium">{activity.user?.name || t('unknown_user')}</span> {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.created_at}</p>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('no_recent_activity')}</p>
            )}
          </SectionCard>
        </div>
      </div>
    </MobileLayout>
  );
}