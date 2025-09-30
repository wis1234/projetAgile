import React, { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Notification from '../../Components/Notification';
import TaskModal from '../../Components/TaskModal';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaSearch, FaTasks, FaEdit, FaTrash, FaEye, FaPlus, FaFilter, FaCalendarAlt, FaProjectDiagram, FaList, FaTh } from 'react-icons/fa';

// Icônes Heroicons SVG inline - Remplacées par react-icons si possible
const KanbanIcon = () => (
  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
);

// Composant pour afficher le badge de statut
const getStatusBadge = (status, t) => {
  const statusText = t(`status.${status}`, { defaultValue: status });
  switch(status) {
    case 'todo':
      return <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">{statusText}</span>;
    case 'in_progress':
      return <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{statusText}</span>;
    case 'done':
      return <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">{statusText}</span>;
    default:
      return <span className="inline-block px-3 py-1 rounded-full bg-gray-300 text-gray-600 text-xs font-bold">{statusText}</span>;
  }
};

// Composant pour afficher le badge de priorité
const getPriorityBadge = (priority, t) => {
  const priorityText = t(`priority.${priority}`, { defaultValue: priority });
  switch(priority) {
    case 'low':
      return <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">{priorityText}</span>;
    case 'medium':
      return <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{priorityText}</span>;
    case 'high':
      return <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">{priorityText}</span>;
    default:
      return <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">{priorityText}</span>;
  }
};

const Index = ({ tasks, filters }) => {
  const { t } = useTranslation();
  const { flash = {}, errors = {}, auth } = usePage().props;
  const [notification, setNotification] = useState(flash.success ? t(flash.success) : '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [search, setSearch] = useState(filters?.search || '');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalTask, setModalTask] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile/tablette au chargement et au redimensionnement
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint de Tailwind
      setIsMobile(mobile);
      if (mobile) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (window.Echo) {
      const channel = window.Echo.channel('tasks');
      channel.listen('TaskUpdated', (e) => {
        setNotification('Une tâche a été modifiée (ou ajoutée/supprimée)');
        setNotificationType('success');
        // Recharge la liste sans perdre les filtres
        router.reload({ only: ['tasks'] });
      });
      return () => {
        channel.stopListening('TaskUpdated');
      };
    }
  }, []);

  useEffect(() => {
    if (flash.success) {
      setNotification(flash.success);
      setNotificationType('success');
    }
  }, [flash.success]);

  const handleDelete = (id) => {
    if (confirm(t('task_delete_confirm'))) {
      router.delete(`/tasks/${id}`, {
        onSuccess: () => {
          setNotification(t('task_deleted_success'));
          setNotificationType('success');
        },
        onError: () => {
          setNotification(t('task_delete_error'));
          setNotificationType('error');
        }
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get('/tasks', { search }, { preserveState: true, replace: true });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setModalTask(null);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    setModalTask(task);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    setModalTask(null);
    if (refresh) {
      router.reload({ only: ['tasks'] });
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
      <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        {notification && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl text-white transition-all ${notificationType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification}
          </div>
        )}

        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{t('task_management')}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            {/* View Mode Toggle - Responsive */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <FaList className="text-xs" />
                <span className="hidden sm:inline">{t('table_view')}</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <FaTh className="text-xs" />
                <span className="hidden sm:inline">{t('cards_view')}</span>
              </button>
            </div>
            
            <Link href="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap text-sm sm:text-base">
              <FaPlus className="text-sm sm:text-lg" /> 
              <span className="hidden sm:inline">{t('new_task')}</span>
              <span className="sm:hidden">{t('new')}</span>
            </Link>
            <Link href="/kanban" className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap text-sm sm:text-base">
              <KanbanIcon /> 
              <span className="hidden sm:inline">{t('task_tracking')}</span>
              <span className="sm:hidden">{t('tracking')}</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('search_by_title')}</label>
              <div className="relative">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('search_task_placeholder')}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button type="submit" className="md:col-span-1 lg:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md">
              <FaSearch /> {t('apply')}
            </button>
          </form>
        </div>

        {/* Task View Section */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition duration-200 hover:shadow-lg mb-8">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">{t('title')}</th>
                  <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">{t('project')}</th>
                  <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">{t('status_label')}</th>
                  <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">{t('priority_label')}</th>
                  <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">{t('assigned_to')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                      {t('no_tasks_found')}
                    </td>
                  </tr>
                ) : tasks.data.map(task => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                    onClick={() => router.visit(`/tasks/${task.id}`)}
                  >
                    <td className="p-4 align-middle font-semibold text-blue-700 dark:text-blue-200 group-hover:underline">{task.title}</td>
                    <td className="p-4 align-middle text-gray-600 dark:text-gray-300">{task.project?.name || <span className="italic text-gray-400">Aucun</span>}</td>
                    <td className="p-4 align-middle">
                      {getStatusBadge(task.status, t)}
                    </td>
                    <td className="p-4 align-middle">
                      {getPriorityBadge(task.priority, t)}
                    </td>
                    <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                      {task.assigned_user || task.assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            {(task.assigned_user?.name || task.assignedUser?.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span>{(task.assigned_user?.name || task.assignedUser?.name)}</span>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">{t('unassigned')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {tasks.data.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <FaTasks className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-xl text-gray-500 dark:text-gray-400">{t('no_tasks_found')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('create_first_task')}</p>
              </div>
            ) : tasks.data.map(task => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                onClick={() => router.visit(`/tasks/${task.id}`)}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {task.title}
                  </h3>
                  <div className="flex-shrink-0">
                    {getPriorityBadge(task.priority, t)}
                  </div>
                </div>

                {/* Project Info */}
                {task.project && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('project')}</p>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaProjectDiagram className="text-blue-500 text-sm" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {task.project.name}
                      </span>
                      {task.project_is_muted && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full flex-shrink-0">
                            {t('muted')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status and Assignee */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('status')}</p>
                    {getStatusBadge(task.status, t)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assigned_to')}</p>
                    {task.assigned_user || task.assignedUser ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          {(task.assigned_user?.name || task.assignedUser?.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {(task.assigned_user?.name || task.assignedUser?.name || '').split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t('unassigned')}</span>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                {task.due_date && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FaCalendarAlt className="text-xs" />
                      <span>{t('due_date')}: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center gap-3 mb-8">
          {tasks.links && tasks.links.map((link, i) => (
            <button
              key={i}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition duration-200 
                ${link.active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600 hover:text-blue-800 dark:hover:text-white hover:shadow-sm'}
                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url)}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// Création d'un composant wrapper pour gérer le layout
const IndexWithLayout = (props) => {
  const { t } = useTranslation();
  
  return (
    <AdminLayout title={t('task_management')}>
      <Index {...props} />
    </AdminLayout>
  );
};

// Configuration du layout pour Inertia
IndexWithLayout.layout = (page) => page;

export default IndexWithLayout; 