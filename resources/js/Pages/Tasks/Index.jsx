import React, { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import Notification from '../../Components/Notification';
import TaskModal from '../../Components/TaskModal';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaSearch, FaTasks, FaEdit, FaTrash, FaEye, FaPlus, FaFilter, FaCalendarAlt } from 'react-icons/fa';

// Icônes Heroicons SVG inline - Remplacées par react-icons si possible
const KanbanIcon = () => (
  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
);

function Index({ tasks, filters }) {
  const { flash = {}, errors = {}, auth } = usePage().props;
  const [notification, setNotification] = useState(flash.success || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [search, setSearch] = useState(filters?.search || '');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalTask, setModalTask] = useState(null);

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
    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      router.delete(`/tasks/${id}`, {
        onSuccess: () => {
          setNotification('Tâche supprimée avec succès');
          setNotificationType('success');
        },
        onError: () => {
          setNotification('Erreur lors de la suppression');
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
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Gestion des Tâches</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            <Link href="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap">
              <FaPlus className="text-lg" /> Nouvelle tâche
            </Link>
            <Link href="/kanban" className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap">
              <KanbanIcon /> Voir Kanban
            </Link>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche par titre</label>
              <div className="relative">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une tâche..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button type="submit" className="md:col-span-1 lg:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md">
              <FaSearch /> Appliquer
            </button>
          </form>
        </div>

        {/* Task Table Section */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition duration-200 hover:shadow-lg mb-8">
          <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Titre</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Projet</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Statut</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Priorité</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Assigné à</th>
              </tr>
            </thead>
            <tbody>
              {tasks.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                    Aucune tâche trouvée pour cette recherche ou filtre.
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
                    {task.status === 'todo' && <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">À faire</span>}
                    {task.status === 'in_progress' && <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">En cours</span>}
                    {task.status === 'done' && <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Terminé</span>}
                    {!['todo','in_progress','done'].includes(task.status) && <span className="inline-block px-3 py-1 rounded-full bg-gray-300 text-gray-600 text-xs font-bold">{task.status}</span>}
                  </td>
                  <td className="p-4 align-middle">
                    {task.priority === 'low' && <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">Faible</span>}
                    {task.priority === 'medium' && <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Moyenne</span>}
                    {task.priority === 'high' && <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">Élevée</span>}
                    {!['low','medium','high'].includes(task.priority) && <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">{task.priority}</span>}
                  </td>
                  <td className="p-4 align-middle text-gray-600 dark:text-gray-300">{task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Aucun</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

Index.layout = page => <AdminLayout children={page} />;
export default Index; 