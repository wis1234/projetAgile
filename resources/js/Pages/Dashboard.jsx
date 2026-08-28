import React from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { FaChartLine, FaUsers, FaTasks, FaProjectDiagram, FaFileAlt, FaChevronRight, FaDownload, FaUserPlus } from 'react-icons/fa';
import RecruitmentCard from '@/Components/RecruitmentCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

// ── Widget stat (même forme que SummaryCard de la page Projets) ─────────────

const Widget = ({ title, count, color, link, icon: Icon }) => {
  const { t } = useTranslation();

  const content = (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all min-w-0">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="text-lg sm:text-xl text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{count ?? 0}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate">{title}</p>
      </div>
    </div>
  );

  return link ? (
    <Link href={link} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 h-full min-w-0">
      {content}
    </Link>
  ) : content;
};

// ── Accès rapide ──────────────────────────────────────────────────────────────

const QuickAccess = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 text-white">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <FaChartLine /> {t('quick_access')}
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {[
            { icon: <FaTasks />, label: t('new_task'), link: '/tasks/create' },
            { icon: <FaProjectDiagram />, label: t('new_project'), link: '/projects/create' },
            { icon: <FaUsers />, label: t('add_member'), link: '/users/create' },
            { icon: <FaFileAlt />, label: t('import_file'), link: '/files/upload' },
            { icon: <FaUserPlus />, label: t('recruitment_offers'), link: '/recruitment' },
          ].map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="flex items-center p-2.5 sm:p-3 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 active:scale-[0.98] transition-all min-w-0"
            >
              <span className="mr-3 flex-shrink-0">{item.icon}</span>
              <span className="font-medium text-sm sm:text-base truncate min-w-0">{item.label}</span>
              <FaChevronRight className="ml-auto h-3 w-3 opacity-70 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Badge statut (répartition des tâches) ───────────────────────────────────

const StatusBadge = ({ status, count }) => {
  const { t } = useTranslation();
  const statusConfig = {
    todo: { label: t('status_todo'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    in_progress: { label: t('status_in_progress'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    done: { label: t('status_done'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    en_attente: { label: t('status_pending'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="flex items-center justify-between gap-2 py-2 min-w-0">
      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
        {config.label}
      </span>
      <span className="font-medium text-sm flex-shrink-0">{count}</span>
    </div>
  );
};

export default function Dashboard({ auth, stats = {}, activityByDay = [], recentActivities = [], topUsers = [], recentProjects = [], recentFiles = [] }) {
  const { t } = useTranslation();
  const isAdmin = auth?.user?.roles?.includes('admin');

  const tasksByStatus = stats.tasksByStatus || {
    todo: 0,
    in_progress: 0,
    done: 0,
    en_attente: 0
  };

  const statsData = [
    {
      title: t('tasks'),
      count: stats.tasks || 0,
      color: 'bg-indigo-500',
      link: '/tasks',
      icon: FaTasks,
      show: true
    },
    {
      title: t('projects'),
      count: stats.projects || 0,
      color: 'bg-blue-500',
      link: '/projects',
      icon: FaProjectDiagram,
      show: true
    },
    {
      title: t('team_members'),
      count: stats.members || 0,
      color: 'bg-purple-500',
      link: '/users',
      icon: FaUsers,
      show: isAdmin
    },
    {
      title: t('files'),
      count: stats.files || 0,
      color: 'bg-amber-500',
      link: '/files',
      icon: FaFileAlt,
      show: true
    },
  ];

  const visibleWidgets = statsData.filter(widget =>
    widget.show !== false &&
    (widget.count > 0 || widget.count === 0) &&
    widget.link
  );

  const activityChartData = {
    labels: activityByDay.map(a => new Date(a.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Activités',
        data: activityByDay.map(a => a.count),
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const tasksByStatusData = {
    labels: ['À faire', 'En cours', 'Terminées', 'En attente'],
    datasets: [
      {
        data: [
          tasksByStatus.todo || 0,
          tasksByStatus.in_progress || 0,
          tasksByStatus.done || 0,
          tasksByStatus.en_attente || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* En-tête — même structure que la page Projets */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words">
              {t('dashboard').toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('dashboard_subtitle')}
            </p>
          </div>
          <div className="w-full sm:w-64 flex-shrink-0 min-w-0">
            <RecruitmentCard />
          </div>
        </div>

        {/* Grille des widgets — même grille/gap que les SummaryCard de Projets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleWidgets.map((widget, index) => (
            <Widget
              key={index}
              title={widget.title}
              count={widget.count}
              color={widget.color}
              link={widget.link}
              icon={widget.icon}
            />
          ))}
        </div>

        {/* Graphique d'activité et membres actifs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">{t('recent_activity')}</h2>
            <div className="h-52 sm:h-64">
              <Line
                data={activityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                      ticks: {
                        stepSize: 1,
                        font: { size: 10 },
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">{t('active_team_members')}</h2>
            <div className="space-y-4">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.count} activités</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('no_recent_user_activity')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Répartition des tâches */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">Répartition des tâches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-52 sm:h-64 min-w-0">
              <Pie
                data={tasksByStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#6B7280',
                        boxWidth: 12,
                        padding: 12,
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-2 md:mt-6 space-y-1 sm:space-y-2 min-w-0">
              <StatusBadge status="todo" count={tasksByStatus.todo || 0} />
              <StatusBadge status="in_progress" count={tasksByStatus.in_progress || 0} />
              <StatusBadge status="done" count={tasksByStatus.done || 0} />
              <StatusBadge status="en_attente" count={tasksByStatus.en_attente || 0} />
            </div>
          </div>
        </div>

        {/* Projets récents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('recent_projects')}</h2>
            <Link
              href="/projects"
              className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center flex-shrink-0"
            >
              {t('view_all_projects')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                >
                  <div className="p-4 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-w-0 truncate">
                        {project.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap flex-shrink-0">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {project.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                      <div className="flex items-center min-w-0">
                        {project.manager.avatar ? (
                          <img
                            src={project.manager.avatar}
                            alt={project.manager.name}
                            className="w-6 h-6 rounded-full mr-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {project.manager.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-gray-600 dark:text-gray-300 truncate">{project.manager.name}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                        {project.task_count} {t('tasks')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-right">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 inline-flex items-center gap-1">
                      {t('view_project')} <FaChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                <p>{t('no_recent_projects')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fichiers récents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('recent_files')}</h2>
            <Link
              href="/files"
              className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center flex-shrink-0"
            >
              {t('view_all_files')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {recentFiles && recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href={`/files/${file.id}`}
                  className="group flex items-center justify-between gap-2 p-2.5 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.99] rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FaFileAlt className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {file.size} • {file.created_at}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 flex-shrink-0 transition-colors"
                    title="Télécharger"
                  >
                    <FaDownload />
                  </a>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('no_recent_files')}
              </p>
            )}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('recent_activities')}</h2>
            <Link
              href="/activities"
              className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center flex-shrink-0"
            >
              {t('view_all_activities')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const ActivityWrapper = activity.url ? Link : 'div';
                const wrapperProps = activity.url
                  ? { href: activity.url, className: 'group flex items-start space-x-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0' }
                  : { className: 'flex items-start space-x-3 p-2 -mx-2 min-w-0' };

                return (
                  <ActivityWrapper key={activity.id} {...wrapperProps}>
                    <div className="flex-shrink-0">
                      {activity.user?.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                            {activity.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-800 dark:text-gray-200 break-words ${activity.url ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' : ''}`}>
                        <span className="font-medium">{activity.user?.name || t('unknown_user')}</span>
                        {' '}{activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.created_at}
                      </p>
                    </div>
                  </ActivityWrapper>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('no_recent_activity')}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

Dashboard.layout = page => <AdminLayout children={page} />;