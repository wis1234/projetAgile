import React from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { FaChartLine, FaUsers, FaTasks, FaProjectDiagram, FaFileAlt, FaChevronRight, FaDownload } from 'react-icons/fa';
import { motion } from 'framer-motion';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const Widget = ({ title, count, color, link, icon }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
    className={`${color} rounded-xl p-6 shadow-md transition-all duration-300`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{count ?? '0'}</p>
      </div>
      <div className="p-3 rounded-lg bg-white bg-opacity-20 dark:bg-opacity-10">
        {React.cloneElement(icon, { className: 'text-2xl' })}
      </div>
    </div>
    {link && (
      <Link 
        href={link} 
        className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
      >
        Voir plus <FaChevronRight className="ml-1 h-3 w-3" />
      </Link>
    )}
  </motion.div>
);

const QuickAccess = () => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FaChartLine /> Accès rapide
      </h2>
      <div className="space-y-3">
        {[
          { icon: <FaTasks />, label: 'Nouvelle tâche', link: '/tasks/create' },
          { icon: <FaProjectDiagram />, label: 'Nouveau projet', link: '/projects/create' },
          { icon: <FaUsers />, label: 'Ajouter un membre', link: '/users/create' },
          { icon: <FaFileAlt />, label: 'Importer un fichier', link: '/files/upload' },
        ].map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className="flex items-center p-3 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all"
          >
            <span className="mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            <FaChevronRight className="ml-auto h-3 w-3 opacity-70" />
          </Link>
        ))}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, count }) => {
  const statusConfig = {
    todo: { label: 'À faire', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    done: { label: 'Terminé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      <span className="font-medium">{count}</span>
    </div>
  );
};

const RecentActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    const icons = {
      task: <FaTasks className="text-blue-500" />,
      project: <FaProjectDiagram className="text-green-500" />,
      file: <FaFileAlt className="text-amber-500" />,
      user: <FaUsers className="text-purple-500" />,
    };
    return icons[type] || <FaFileAlt className="text-gray-500" />;
  };

  return (
    <div className="flex items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.description}
        </p>
        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{new Date(activity.created_at).toLocaleString('fr-FR')}</span>
          {activity.user && (
            <span className="flex items-center ml-3">
              <span className="w-1 h-1 rounded-full bg-gray-400 mr-2"></span>
              {activity.user.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const progress = project.progress || 0;
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
          {project.name}
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {project.status}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
        <span>{project.task_count} tâches</span>
      </div>
    </div>
  );
};

export default function Dashboard({ auth, stats = {}, activityByDay = [], recentActivities = [], topUsers = [], recentProjects = [], recentFiles = [] }) {
  const isAdmin = auth?.user?.roles?.includes('admin');
  // Initialisation des valeurs par défaut pour les tâches par statut
  const tasksByStatus = stats.tasksByStatus || {
    todo: 0,
    in_progress: 0,
    done: 0,
    en_attente: 0
  };

  // Données pour les widgets statistiques
  const statsData = [
    {
      title: 'Tâches',
      count: stats.tasks || 0,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      link: '/tasks',
      icon: <FaTasks className="text-3xl opacity-80" />,
      show: true
    },
    {
      title: 'Projets',
      count: stats.projects || 0,
      color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      link: '/projects',
      icon: <FaProjectDiagram className="text-3xl opacity-80" />,
      show: true
    },
    {
      title: 'Utilisateurs',
      count: stats.users || 0,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      link: '/users',
      icon: <FaUsers className="text-3xl opacity-80" />,
      show: isAdmin // Only show users widget to admins
    },
    {
      title: 'Fichiers',
      count: stats.files || 0,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      link: '/files',
      icon: <FaFileAlt className="text-3xl opacity-80" />,
      show: true
    }
  ];

  // Filter out widgets based on visibility rules and count
  const visibleWidgets = statsData.filter(widget => 
    widget.show !== false && // Respect the show flag
    (widget.count > 0 || widget.count === 0) && 
    widget.link
  );

  // Données pour le graphique d'activité
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

  // Données pour le graphique des tâches par statut
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Aperçu de l'activité et des statistiques de votre espace de travail
          </p>
        </motion.div>

        {/* Grille des widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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

        {/* Graphique d'activité et utilisateurs actifs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Activité récente</h2>
            <div className="h-64">
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
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Utilisateurs actifs</h2>
            <div className="space-y-4">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.count} activités</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      #{index + 1}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune activité utilisateur récente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section Répartition des tâches */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Répartition des tâches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
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
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-6 space-y-2">
              <StatusBadge status="todo" count={tasksByStatus.todo || 0} />
              <StatusBadge status="in_progress" count={tasksByStatus.in_progress || 0} />
              <StatusBadge status="done" count={tasksByStatus.done || 0} />
              <StatusBadge status="en_attente" count={tasksByStatus.en_attente || 0} />
            </div>
          </div>
        </motion.div>

        {/* Section Projets récents */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Projets récents</h2>
            <Link 
              href="/projects" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
            >
              Voir tous les projets <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div 
                  key={project.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {project.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        {project.manager.avatar ? (
                          <img 
                            src={project.manager.avatar} 
                            alt={project.manager.name} 
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {project.manager.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-gray-600 dark:text-gray-300">{project.manager.name}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {project.task_count} tâches
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-right">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Voir le projet
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                <p>Aucun projet récent</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Section Fichiers récents */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Fichiers récents</h2>
            <Link 
              href="/files" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
            >
              Voir tous les fichiers <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentFiles && recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <FaFileAlt className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.size} • {file.created_at}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <FaDownload />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun fichier récent
              </p>
            )}
          </div>
        </motion.div>

        {/* Section Activités récentes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Activités récentes</h2>
            <Link 
              href="/activities" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
            >
              Voir toutes les activités <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
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
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{activity.user?.name || 'Utilisateur inconnu'}</span>
                      {' '}{activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.created_at}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune activité récente
              </p>
            )}
          </div>
        </motion.div>

        {/* Pied de page */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <p> {new Date().getFullYear()} ProjA - Tous droits réservés</p>
        </motion.div>
      </div>
    </div>
  );
}

Dashboard.layout = page => <AdminLayout children={page} />;
