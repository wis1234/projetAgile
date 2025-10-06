import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FaProjectDiagram, FaUsers, FaTasks, FaEdit, FaEye, FaArrowLeft, FaCalendarAlt,
  FaUserFriends, FaClipboardList, FaRocket, FaUserPlus, FaFileExport,
  FaChevronDown, FaFileAlt, FaFilePdf, FaFileWord, FaTrash, FaChartLine, FaCommentDots,
  FaCheckCircle, FaClock, FaPlay, FaChartBar, FaCrown, FaUser, FaShieldAlt, 
  FaPlus, FaGlobe, FaExternalLinkAlt, FaQuestionCircle, FaArrowUp, FaArrowDown, 
  FaEquals, FaExclamationTriangle
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import Modal from '../../Components/Modal';
import ZoomMeeting from '../../Components/ZoomMeeting';

const getStatusInfo = (status, t) => {
  const statusMap = {
    'todo': { color: 'bg-gray-100 text-gray-800', icon: <FaClock className="mr-1.5" />, text: t('status_todo') },
    'in_progress': { color: 'bg-blue-100 text-blue-800', icon: <FaPlay className="mr-1.5" />, text: t('status_in_progress') },
    'done': { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mr-1.5" />, text: t('status_done') },
  };
  return statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: <FaQuestionCircle className="mr-1.5" />, text: status };
};

const getPriorityInfo = (priority, t) => {
  const priorityMap = {
    // English priorities
    'high': { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', 
      icon: <FaArrowUp className="mr-1.5" />, 
      text: t('priority.high'),
      order: 1
    },
    'medium': { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', 
      icon: <FaEquals className="mr-1.5" />, 
      text: t('priority.medium'),
      order: 2
    },
    'low': { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', 
      icon: <FaArrowDown className="mr-1.5" />, 
      text: t('priority.low'),
      order: 3
    },
    // French priorities
    'haute': { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', 
      icon: <FaArrowUp className="mr-1.5" />, 
      text: t('priority.high'),
      order: 1
    },
    'moyenne': { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', 
      icon: <FaEquals className="mr-1.5" />, 
      text: t('priority.medium'),
      order: 2
    },
    'basse': { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', 
      icon: <FaArrowDown className="mr-1.5" />, 
      text: t('priority.low'),
      order: 3
    }
  };
  
  return priorityMap[priority?.toLowerCase()] || { 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: <FaQuestionCircle className="mr-1.5" />, 
    text: priority,
    order: 0
  };
};

function Show({ project, tasks = [], auth, stats = {} }) {
  const { t, i18n } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const { flash = {} } = usePage().props;
  
  const userRoles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = userRoles.includes('admin');
  const isManager = userRoles.includes('manager');
  const isMember = userRoles.includes('member');

  // Trier les tâches par date de création (les plus récentes en premier)
  const sortedTasks = tasks?.data ? [...(tasks.data || [])].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  ) : [];
  
  // Afficher uniquement les 5 dernières tâches si showAllTasks est false
  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, 5);
  const hasMoreTasks = sortedTasks.length > 5;

  const handleDelete = () => {
    setDeleteLoading(true);
    router.delete(route('projects.destroy', project.id), {
      onSuccess: () => {
        setDeleteLoading(false);
        setShowDeleteModal(false);
      },
      onError: () => {
        setDeleteLoading(false);
      },
      preserveScroll: true
    });
  };

  // Préparation données graphique
  const last30Days = Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const taskCounts = last30Days.map(date => {
    const tasksData = tasks.data || [];
    const tasksForDate = tasksData.filter(task => {
      const taskDate = new Date(task.created_at).toISOString().split('T')[0];
      return taskDate === date;
    });
    return {
      date,
      total: tasksForDate.length,
      done: tasksForDate.filter(t => t.status === 'done').length
    };
  });

  let cumulativeTotal = 0;
  let cumulativeDone = 0;
  
  const chartData = taskCounts.map(day => {
    cumulativeTotal += day.total;
    cumulativeDone += day.done;
    return { ...day, cumulativeTotal, cumulativeDone };
  });
  
  const trendChartData = {
    labels: last30Days.map(date => new Date(date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})),
    datasets: [
      {
        label: t('total_tasks'),
        data: chartData.map(d => d.cumulativeTotal),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: t('completed_tasks'),
        data: chartData.map(d => d.cumulativeDone),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { size: 11 } } },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { stepSize: 1 } },
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="w-full">
          {/* Messages flash */}
          {flash.success && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="px-4 py-3 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium">
                {flash.success}
              </div>
            </div>
          )}

          {/* En-tête du projet */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FaProjectDiagram className="text-white text-xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <FaCalendarAlt className="text-xs" />
                      {new Date(project.created_at).toLocaleDateString(i18n.language, {day: '2-digit', month: 'long', year: 'numeric'})}
                    </p>
                  </div>
                </div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all self-start sm:self-center"
                >
                  <FaArrowLeft className="text-sm" />
                  {t('back_to_projects')}
                </Link>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Layout en 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Carte infos projet */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaClipboardList className="text-blue-500" />
                  {t('project_description_label')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {project.description || t('no_description')}
                </p>

                {project.meeting_link && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaGlobe className="text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-900 dark:text-blue-200">{t('meeting_link_title')}</span>
                    </div>
                    <a 
                      href={project.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all flex items-center gap-1"
                    >
                      <FaExternalLinkAlt className="text-xs flex-shrink-0" />
                      {project.meeting_link}
                    </a>
                  </div>
                )}
              </div>

              {/* Stats en cartes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<FaCheckCircle className="text-emerald-500 text-2xl" />} label={t('completed_tasks')} value={stats.doneTasksCount ?? 0} color="emerald" />
                <StatCard icon={<FaClock className="text-blue-500 text-2xl" />} label={t('tasks_in_progress')} value={stats.inProgressTasksCount ?? 0} color="blue" />
                <StatCard icon={<FaFileAlt className="text-purple-500 text-2xl" />} label={t('files')} value={stats.filesCount ?? 0} color="purple" />
                <StatCard icon={<FaCommentDots className="text-amber-500 text-2xl" />} label={t('comments')} value={stats.commentsCount ?? 0} color="amber" />
              </div>

              {/* Réunion Zoom */}
              <div className="mt-6">
                <ZoomMeeting project={project} />
              </div>

              {/* Liste des tâches */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaTasks className="text-blue-500" />
                    {t('tasks_section_title')} ({tasks?.total || 0})
                  </h3>
                  <Link 
                    href={route('tasks.create', { project_id: project.id })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <FaPlus className="text-xs" />
                    {t('new_task')}
                  </Link>
                </div>

                {(!tasks?.data || tasks.data.length === 0) ? (
                  <div className="text-center py-12">
                    <FaTasks className="text-4xl mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{t('no_tasks_for_project')}</p>
                    <Link 
                      href={route('tasks.create', { project_id: project.id })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                    >
                      <FaPlus />
                      {t('create_task')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => router.visit(route('tasks.show', task.id))}
                        className="group p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityInfo(task.priority, t).color}`}>
                                {getPriorityInfo(task.priority, t).icon}
                                {getPriorityInfo(task.priority, t).text}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusInfo(task.status, t).color}`}>
                                {getStatusInfo(task.status, t).icon}
                                {getStatusInfo(task.status, t).text}
                              </span>
                            </div>
                          </div>
                          {task.assigned_user && (
                            <div className="flex items-center gap-2">
                              <img 
                                src={task.assigned_user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user.name)}`}
                                alt={task.assigned_user.name}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreTasks && !showAllTasks && (
                      <div className="mt-4 text-center">
                        <Link
                          href={route('tasks.index', { project: project.id })}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {t('show_all_tasks')} ({tasks.data.length})
                          <FaArrowDown className="text-xs" />
                        </Link>
                      </div>
                    )}
                    
                    {showAllTasks && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllTasks(false)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {t('show_less')}
                          <FaArrowUp className="text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar droite */}
            <div className="space-y-6">
              {/* Actions rapides compactes */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                  {t('quick_actions')}
                </h3>
                <div className="space-y-2">
                  <Link
                    href={route('projects.sprints.create', { project: project.id })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaRocket className="text-white text-sm" />
                    </div>
                    <span className="font-medium text-sm">{t('add_sprint')}</span>
                  </Link>

                  {(isAdmin || isManager) && (
                    <Link
                      href={route('project-users.create')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FaUserPlus className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-sm">{t('add_member')}</span>
                    </Link>
                  )}

                  <Link
                    href={route('tasks.create', { project_id: project.id })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaTasks className="text-white text-sm" />
                    </div>
                    <span className="font-medium text-sm">{t('add_task')}</span>
                  </Link>

                  {/* Export dropdown */}
                  <div className="relative group/export">
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                        <FaFileExport className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-sm flex-1 text-left">{t('export')}</span>
                      <FaChevronDown className="text-xs" />
                    </button>
                    
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50">
                      <a 
                        href={`/projects/${project.id}/suivi-global/txt`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <FaFileAlt className="text-blue-600 text-sm" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{t('txt_format')}</div>
                          <div className="text-xs text-gray-500">{t('simple_and_light')}</div>
                        </div>
                      </a>
                      <a 
                        href={`/projects/${project.id}/suivi-global/pdf`} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                          <FaFilePdf className="text-red-600 text-sm" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">PDF</div>
                          <div className="text-xs text-gray-500">{t('ideal_for_sharing')}</div>
                        </div>
                      </a>
                      <a 
                        href={`/projects/${project.id}/suivi-global/docx`} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                          <FaFileWord className="text-blue-700 text-sm" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Word</div>
                          <div className="text-xs text-gray-500">{t('easily_editable')}</div>
                        </div>
                      </a>
                    </div>
                  </div>

                  {(isAdmin || isManager) && (
                    <>
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="flex items-center gap-3 w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaEdit className="text-white text-sm" />
                        </div>
                        <span className="font-medium text-sm">{t('edit_project')}</span>
                      </Link>
                      
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaTrash className="text-white text-sm" />
                        </div>
                        <span className="font-medium text-sm">{t('delete_project')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Membres */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    {t('project_members')} ({project.users?.length || 0})
                  </h3>
                  <Link href={route('project-users.show', project.id)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    {t('view_all')}
                  </Link>
                </div>
                <div className="space-y-2">
                  {project.users && project.users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img 
                        src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}` }
                        alt={user.name}
                        className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      {user.role === 'admin' ? (
                        <FaShieldAlt className="text-red-500 text-sm flex-shrink-0" />
                      ) : user.role === 'manager' ? (
                        <FaCrown className="text-amber-500 text-sm flex-shrink-0" />
                      ) : (
                        <FaUser className="text-blue-500 text-sm flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progression par membre */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                  {t('tasks_completed_by_member')}
                </h3>
                <div className="space-y-3">
                  {project.users?.slice(0, 4).map(user => {
                    const tasksData = tasks.data || [];
                    const userDoneTasks = tasksData.filter(t => t.status === 'done' && t.assigned_to === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
                            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-600"
                            alt={user.name}
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{width: `${Math.min((userDoneTasks.length / (tasksData.length || 1)) * 100, 100)}%`}}
                              ></div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {userDoneTasks.length}
                          </span>
                        </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>

          {/* Graphique en pleine largeur en bas */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaChartLine className="text-blue-500" />
                {t('tasks_evolution')}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600 dark:text-gray-300">{t('total_tasks')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-600 dark:text-gray-300">{t('completed_tasks')}</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>

          {/* Modal suppression */}
          <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">{t('delete_project_title')}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {t('delete_project_confirm', { name: project.name })}
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                  ) : (
                    <FaTrash className="mr-2 h-4 w-4 inline" />
                  )}
                  {deleteLoading ? t('deleting') : t('delete_project_permanently')}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
};

Show.layout = page => <AdminLayout>{page}</AdminLayout>;

export default Show;