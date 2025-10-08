import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaFlagCheckered, FaEdit, FaProjectDiagram, FaArrowLeft, FaTasks, FaUser, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';


// Composant principal avec layout intégré
const Show = ({ sprint }) => {

    const { t } = useTranslation();

      const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      todo: 'bg-gray-200 text-gray-800',
      in_progress: 'bg-blue-200 text-blue-800',
      done: 'bg-green-200 text-green-800',
    };
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      done: 'Terminé',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.todo}`}>{labels[status] || status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-200 text-gray-800',
      medium: 'bg-yellow-200 text-yellow-800',
      high: 'bg-red-200 text-red-800',
    };
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[priority] || styles.low}`}>{labels[priority] || priority}</span>;
  };

  const assignedUsers = sprint.tasks
    ? sprint.tasks
        .map(task => task.assigned_user)
        .filter((user, index, self) => user && self.findIndex(u => u.id === user.id) === index)
    : [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-950 p-0 m-0">
      <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('sprints.index')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              title={t('back_to_sprints_list')}
            >
              <FaArrowLeft className="h-6 w-6" />
            </Link>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              <FaFlagCheckered className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{sprint.name}</h1>
              <p className="text-md text-gray-500 dark:text-gray-400">{t('sprint_details')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={route('sprints.edit', sprint.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md"
            >
              <FaEdit />
              <span className="hidden sm:inline">{t('edit')}</span>
            </Link>
            <Link 
              href={route('sprints.index')}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">{t('back')}</span>
            </Link>
          </div>
        </div>

        {/* Sprint Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('general_information')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{sprint.description || <span className="italic">{t('no_description')}</span>}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <FaCalendarAlt className="text-blue-500" />
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('start_date')}:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(sprint.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <FaCalendarAlt className="text-red-500" />
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('end_date')}:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(sprint.end_date)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">{t('associated_project')}</h3>
              {sprint.project ? (
                <Link href={route('projects.show', sprint.project.id)} className="block group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                      <FaProjectDiagram className="text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700 dark:text-blue-300 group-hover:underline">{sprint.project.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('view_project_details')}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">{t('no_associated_project')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Users */}
        {assignedUsers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3">
              <FaUser /> {t('team_members')}
            </h3>
            <div className="flex flex-wrap gap-4">
              {assignedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <img
                    src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&color=7F9CF5&background=EBF4FF`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
            <FaTasks /> {t('sprint_tasks', { count: sprint.tasks?.length || 0 })}
          </h2>
          {sprint.tasks && sprint.tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-4 font-semibold">{t('title')}</th>
                    <th className="p-4 font-semibold">{t('assigned_to')}</th>
                    <th className="p-4 font-semibold">{t('status')}</th>
                    <th className="p-4 font-semibold">{t('priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sprint.tasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="p-4">
                        <Link href={route('tasks.show', task.id)} className="font-semibold text-blue-600 hover:underline">
                          {task.title}
                        </Link>
                      </td>
                      <td className="p-4">
                        {task.assigned_user ? (
                          <div className="flex items-center gap-2">
                            <img src={task.assigned_user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user.name)}&color=7F9CF5&background=EBF4FF`} alt={task.assigned_user.name} className="w-6 h-6 rounded-full" />
                            <span>{task.assigned_user.name}</span>
                          </div>
                        ) : <span className="text-gray-400 italic">{t('unassigned')}</span>}
                      </td>
                          <td className="p-4">{getStatusBadge(task.status)}</td>
                      <td className="p-4">{getPriorityBadge(task.priority)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('no_tasks_in_sprint')}</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

// Configuration du layout avec le titre statique pour éviter les problèmes de hooks
Show.layout = page => <AdminLayout title="Détails du sprint">{page}</AdminLayout>;

export default Show;