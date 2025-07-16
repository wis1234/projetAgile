import React, { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import Notification from '../../Components/Notification';
import TaskModal from '../../Components/TaskModal';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaSearch } from 'react-icons/fa';

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
    <div className="flex flex-col h-full w-full">
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification}
          <button onClick={() => setNotification('')} className="ml-4 text-white font-bold">&times;</button>
        </div>
      )}
      <TaskModal show={showModal} onClose={handleModalClose} task={modalTask} mode={modalMode} />
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 md:gap-0">
          <div className="flex gap-2 items-center mb-2 md:mb-0">
            <Link href="/tasks/create">
              <ActionButton variant="primary" className="flex items-center"><span className="text-xl mr-2">+</span> Nouvelle tâche</ActionButton>
            </Link>
            <Link href="/kanban" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center font-semibold">
              <KanbanIcon /> Kanban
            </Link>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="border px-3 py-2 rounded w-full md:w-64 mb-0"
            />
            <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
              <FaSearch />
            </button>
          </form>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={createdFrom}
              onChange={e => handleDateFilter(e.target.value, createdTo)}
              className="border px-2 py-1 rounded"
              placeholder="Du"
            />
            <span className="mx-1">-</span>
            <input
              type="date"
              value={createdTo}
              onChange={e => handleDateFilter(createdFrom, e.target.value)}
              className="border px-2 py-1 rounded"
              placeholder="Au"
            />
          </div>
        </div>
        <ul className="space-y-3">
          {tasks.data.length === 0 && <li className="text-gray-500">Aucune tâche trouvée.</li>}
          {tasks.data.map(task => (
            <li key={task.id} className="border p-4 rounded flex flex-col md:flex-row md:justify-between md:items-center bg-white shadow-sm hover:shadow-lg transition group">
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                <span className="font-medium text-lg text-blue-800 dark:text-blue-200 group-hover:underline">{task.title}</span>
                {task.status && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs capitalize">{task.status}</span>}
                {task.priority && <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs capitalize">{task.priority}</span>}
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Link href={`/tasks/${task.id}`} title="Voir la tâche">
                  <ActionButton variant="info" size="sm" className="flex items-center"><EyeIcon /> Voir</ActionButton>
                </Link>
                <Link href={`/tasks/${task.id}/edit`} title="Modifier la tâche">
                  <ActionButton variant="warning" size="sm" className="flex items-center"><EditIcon /> Modifier</ActionButton>
                </Link>
                <ActionButton variant="danger" size="sm" className="flex items-center" title="Supprimer la tâche" onClick={() => handleDelete(task.id)}><TrashIcon /> Supprimer</ActionButton>
                {(auth?.user?.id === task.assigned_to || auth?.user?.id === task.assignedUser?.id) && (
                  <Link
                    href={`/files/create?task_id=${task.id}&project_id=${task.project_id || task.project?.id}`}
                    className="text-green-700 hover:bg-green-100 hover:text-green-800 px-3 py-1 rounded transition flex items-center font-semibold"
                    title="Ajouter un fichier à cette tâche"
                  >
                    + Fichier
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-center mt-6 space-x-2">
          {tasks.links.map((link, i) => (
            <button
              key={i}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, { search, created_from: createdFrom, created_to: createdTo }, { preserveState: true, replace: true })}
              className={`px-3 py-1 rounded ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
        {/* Bouton flottant pour mobile */}
        <button
          onClick={() => router.visit('/tasks/create')}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-3xl md:hidden z-50"
          title="Ajouter une tâche"
        >
          +
        </button>
      </div>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;
export default Index; 