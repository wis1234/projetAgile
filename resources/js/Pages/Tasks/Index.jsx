import React, { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import Notification from '../../Components/Notification';
import TaskModal from '../../Components/TaskModal';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaSearch } from 'react-icons/fa';
import { FaTasks } from 'react-icons/fa';

// Icônes Heroicons SVG inline
const EditIcon = () => (
  <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L7.5 18.79l-4 1 1-4 14.362-14.303ZM19.5 8.25v6.75a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 6 15V6.75A2.25 2.25 0 0 1 8.25 4.5h6.75" /></svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5V6.75A2.25 2.25 0 0 1 8.25 4.5h7.5A2.25 2.25 0 0 1 18 6.75V7.5M4.5 7.5h15M9.75 11.25v4.5m4.5-4.5v4.5M6.75 7.5v9A2.25 2.25 0 0 0 9 18.75h6A2.25 2.25 0 0 0 17.25 16.5v-9" /></svg>
);
const KanbanIcon = () => (
  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
);
const EyeIcon = () => (
  <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);

function Index({ tasks, filters }) {
  const { flash = {}, errors = {}, auth } = usePage().props;
  const [notification, setNotification] = useState(flash.success || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [search, setSearch] = useState(filters?.search || '');
  const [createdFrom, setCreatedFrom] = useState(filters?.created_from || '');
  const [createdTo, setCreatedTo] = useState(filters?.created_to || '');
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
    router.get('/tasks', { search, created_from: createdFrom, created_to: createdTo }, { preserveState: true, replace: true });
  };

  const handleDateFilter = (from, to) => {
    setCreatedFrom(from);
    setCreatedTo(to);
    router.get('/tasks', { search, created_from: from, created_to: to }, { preserveState: true, replace: true });
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
    <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
      <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
          {notification && (
            <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
          )}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <FaTasks className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Tâches</h1>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une tâche..."
                  className="border px-3 py-2 rounded w-full md:w-64 mb-0 focus:ring-2 focus:ring-blue-400"
                />
                <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                  <FaSearch />
                </button>
              </form>
              <Link href="/tasks/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                <span className="text-xl">+</span> Nouvelle tâche
              </Link>
              <Link href="/kanban" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center font-semibold">
                <KanbanIcon /> Kanban
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800 mb-8">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
                <tr>
                  <th className="p-3 text-left font-bold">Titre</th>
                  <th className="p-3 text-left font-bold">Projet</th>
                  <th className="p-3 text-left font-bold">Sprint</th>
                  <th className="p-3 text-left font-bold">Statut</th>
                  <th className="p-3 text-left font-bold">Priorité</th>
                  <th className="p-3 text-left font-bold">Assigné à</th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400 dark:text-gray-500 text-lg font-semibold">
                      Aucune tâche trouvée pour cette recherche.
                    </td>
                  </tr>
                ) : tasks.data.map(task => (
                  <tr
                    key={task.id}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900 transition group cursor-pointer"
                    onClick={() => window.location.href = `/tasks/${task.id}`}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/tasks/${task.id}`; }}
                  >
                    <td className="p-3 align-middle font-semibold text-blue-700 dark:text-blue-200 group-hover:underline">{task.title}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{task.project?.name || '-'}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{task.sprint?.name || '-'}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{task.status}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{task.priority}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{task.assigned_user?.name || task.assignedUser?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {tasks.links && tasks.links.map((link, i) => (
              <button
                key={i}
                className={`btn btn-sm rounded-full px-4 py-2 font-semibold shadow ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;
export default Index; 